import React from 'react';
import { View, VirtualizedList, StyleSheet, MetroListView, } from 'react-native';
const invariant = require('fbjs/lib/invariant');

const defaultProps = {
  ...VirtualizedList.defaultProps,
  columnLayout: [1, ],
};

class VariableColumnList extends React.PureComponent {
  static defaultProps = defaultProps;
  scrollToEnd(params) {
    if (this._listRef) {
      this._listRef.scrollToEnd(params);
    }
  }

  scrollToIndex(params) {
    if (this._listRef) {
      this._listRef.scrollToIndex(params);
    }
  }

  scrollToItem(params) {
    if (this._listRef) {
      this._listRef.scrollToItem(params);
    }
  }

  scrollToOffset(params) {
    if (this._listRef) {
      this._listRef.scrollToOffset(params);
    }
  }

  recordInteraction() {
    if (this._listRef) {
      this._listRef.recordInteraction();
    }
  }

  flashScrollIndicators() {
    if (this._listRef) {
      this._listRef.flashScrollIndicators();
    }
  }

  getScrollResponder() {
    if (this._listRef) {
      return this._listRef.getScrollResponder();
    }
  }

  getScrollableNode() {
    if (this._listRef) {
      return this._listRef.getScrollableNode();
    }
  }

  setNativeProps(props) {
    if (this._listRef) {
      this._listRef.setNativeProps(props);
    }
  }

  constructor(props: Props<ItemT>) {
    super(props);
    this._checkProps(this.props);
    this._layoutTotalCap = this.props.columnLayout.reduce((a, c) => a + c);
    if (this.props.viewabilityConfigCallbackPairs) {
      this._virtualizedListPairs = this.props.viewabilityConfigCallbackPairs.map(
        pair => ({
          viewabilityConfig: pair.viewabilityConfig,
          onViewableItemsChanged: this._createOnViewableItemsChanged(
            pair.onViewableItemsChanged
          ),
        })
      );
    } else if (this.props.onViewableItemsChanged) {
      this._virtualizedListPairs.push({
        viewabilityConfig: this.props.viewabilityConfig,
        onViewableItemsChanged: this._createOnViewableItemsChanged(
          this.props.onViewableItemsChanged
        ),
      });
    }
  }

  componentDidUpdate(prevProps) {
    invariant(
      prevProps.numColumns === this.props.numColumns,
      'Changing numColumns on the fly is not supported. Change the key prop on FlatList when ' +
        'changing the number of columns to force a fresh render of the component.'
    );
    invariant(
      prevProps.onViewableItemsChanged === this.props.onViewableItemsChanged,
      'Changing onViewableItemsChanged on the fly is not supported'
    );
    invariant(
      prevProps.viewabilityConfig === this.props.viewabilityConfig,
      'Changing viewabilityConfig on the fly is not supported'
    );
    invariant(
      prevProps.viewabilityConfigCallbackPairs ===
        this.props.viewabilityConfigCallbackPairs,
      'Changing viewabilityConfigCallbackPairs on the fly is not supported'
    );

    this._checkProps(this.props);
  }

  _hasWarnedLegacy = false;
  _listRef;
  _virtualizedListPairs = [];
  _layoutTotalCap = 0;
  _captureRef = ref => {
    this._listRef = ref;
  };

  _checkProps(props) {
    const {
      getItem,
      getItemCount,
      horizontal,
      legacyImplementation,
      numColumns,
      columnLayout,
      columnWrapperStyle,
      onViewableItemsChanged,
      viewabilityConfigCallbackPairs,
    } = props;
    invariant(
      !getItem && !getItemCount,
      'FlatList does not support custom data formats.'
    );
    if (numColumns > 1) {
      invariant(!horizontal, 'numColumns does not support horizontal.');
    } else {
      invariant(
        !columnWrapperStyle,
        'columnWrapperStyle not supported for single column lists'
      );
    }
    invariant(
      Array.isArray(columnLayout),
      'columnLayout should be an Array',
      numColumns
    );
    // invariant(
    //   legacyImplementation,
    //   'VariableColumnList does not support legacy list'
    // );
    invariant(
      !(onViewableItemsChanged && viewabilityConfigCallbackPairs),
      'FlatList does not support setting both onViewableItemsChanged and ' +
        'viewabilityConfigCallbackPairs.'
    );
  }

  _getItem = (data, index) => {
    const { columnLayout, } = this.props;
    if (columnLayout) {
      const ret = [];
      const cLength = columnLayout.length;
      let itemsCount = columnLayout[index % cLength];
      for (let kk = 0; kk < itemsCount; kk++) {
        const item = data[this._getItemsIndex(index, kk)];
        if (item != null) {
          ret.push(item);
        }
      }
      return ret;
    } else {
      return data[index];
    }
  };

  _getItemCount = data => {
    const { columnLayout, } = this.props;
    if (data && columnLayout) {
      let _l = data.length;
      let row = 0;
      while (_l > 0) {
        columnLayout.forEach(item => {
          if (_l > 0) {
            _l = _l - item;
            row++;
          }
        });
      }

      return row;
    } else return 0;
  };

  _keyExtractor = (items, index) => {
    const { keyExtractor, columnLayout, } = this.props;
    if (columnLayout) {
      const itemsCount = columnLayout[index % columnLayout.length];
      return items
        .map((it, kk) => keyExtractor(it, this._getItemsIndex(index, kk)))
        .join(':');
    } else {
      return keyExtractor(items, index);
    }
  };

  _pushMultiColumnViewable(arr, v) {
    const { numColumns, keyExtractor, } = this.props;
    v.item.forEach((item, ii) => {
      invariant(v.index != null, 'Missing index!');
      const index = this._getItemsIndex(v.index, ii);
      arr.push({ ...v, item, key: keyExtractor(item, index), index, });
    });
  }

  _createOnViewableItemsChanged(
    onViewableItemsChanged: ?(info: {
      viewableItems: Array<ViewToken>,
      changed: Array<ViewToken>,
    }) => void
  ) {
    return (info: {
      viewableItems: Array<ViewToken>,
      changed: Array<ViewToken>,
    }) => {
      const { columnLayout, } = this.props;
      if (onViewableItemsChanged) {
        if (columnLayout) {
          const changed = [];
          const viewableItems = [];
          info.viewableItems.forEach(v =>
            this._pushMultiColumnViewable(viewableItems, v)
          );
          info.changed.forEach(v => this._pushMultiColumnViewable(changed, v));
          onViewableItemsChanged({ viewableItems, changed, });
        } else {
          onViewableItemsChanged(info);
        }
      }
    };
  }

  _getItemsIndex = (index, kk) => {
    const { columnLayout, } = this.props;
    const cLength = columnLayout.length;
    const currentTimes = Math.floor(index / cLength);
    let itemsCount = columnLayout[index % cLength];
    let tillTotal = columnLayout.reduce((a, c, i) => {
      if (index % cLength > i) {
        return a + c;
      } else return a + 0;
    }, 0);
    return this._layoutTotalCap * currentTimes + tillTotal + kk;
  };

  _renderItem = info => {
    const { renderItem, columnLayout, columnWrapperStyle, } = this.props;
    if (columnLayout) {
      const { item, index, } = info;
      const itemsCount = columnLayout[index % columnLayout.length];
      invariant(
        Array.isArray(item),
        'Expected array of items with numColumns > 1'
      );
      return (
        <View style={StyleSheet.compose(styles.row, columnWrapperStyle)}>
          {item.map((it, kk) => {
            const element = renderItem({
              item: it,
              itemIndex: this._getItemsIndex(index, kk),
              rowIndex: index,
              columnIndex: kk,
              separators: info.separators,
            });
            return element && React.cloneElement(element, { key: kk, });
          })}
        </View>
      );
    } else {
      return renderItem(info);
    }
  };

  render() {
    return (
      <VirtualizedList
        {...this.props}
        renderItem={this._renderItem}
        getItem={this._getItem}
        getItemCount={this._getItemCount}
        keyExtractor={this._keyExtractor}
        ref={this._captureRef}
        viewabilityConfigCallbackPairs={this._virtualizedListPairs}
      />
    );
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', },
});

export default VariableColumnList;
