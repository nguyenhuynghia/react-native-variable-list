const React = require('React');
import { View, VirtualizedList, StyleSheet } from 'react-native';
const invariant = require('fbjs/lib/invariant');

import type { DangerouslyImpreciseStyleProp } from 'StyleSheet';
import type {
  ViewabilityConfig,
  ViewToken,
  ViewabilityConfigCallbackPair,
} from 'ViewabilityHelper';
import type { Props as VirtualizedListProps } from 'VirtualizedList';

export type SeparatorsObj = {
  highlight: () => void,
  unhighlight: () => void,
  updateProps: (select: 'leading' | 'trailing', newProps: Object) => void,
};

type RequiredProps<ItemT> = {
  renderItem: (info: {
    item: ItemT,
    itemIndex: number,
    rowIndex: number,
    columnIndex: number,
    separators: SeparatorsObj,
  }) => ?React.Element<any>,
  data: ?$ReadOnlyArray<ItemT>,
  columnLayout: $ReadOnlyArray<number>
};

type OptionalProps<ItemT> = {
  ItemSeparatorComponent?: ?React.ComponentType<any>,
  ListEmptyComponent?: ?(React.ComponentType<any> | React.Element<any>),
  ListFooterComponent?: ?(React.ComponentType<any> | React.Element<any>),
  ListHeaderComponent?: ?(React.ComponentType<any> | React.Element<any>),
  columnWrapperStyle?: DangerouslyImpreciseStyleProp,
  extraData?: any,
  getItemLayout?: (
    data: ?Array<ItemT>,
    index: number,
  ) => {length: number, offset: number, index: number},
  initialNumToRender: number,
  initialScrollIndex?: ?number,
  inverted?: ?boolean,
  keyExtractor: (item: ItemT, index: number) => string,
  onEndReached?: ?(info: {distanceFromEnd: number}) => void,
  onEndReachedThreshold?: ?number,
  onRefresh?: ?() => void,
  onViewableItemsChanged?: ?(info: {
    viewableItems: Array<ViewToken>,
    changed: Array<ViewToken>,
  }) => void,
  progressViewOffset?: number,
  refreshing?: ?boolean,
  removeClippedSubviews?: boolean,
  viewabilityConfig?: ViewabilityConfig,
  viewabilityConfigCallbackPairs?: Array<ViewabilityConfigCallbackPair>,
};
export type Props<ItemT> = RequiredProps<ItemT> &
  OptionalProps<ItemT> &
  VirtualizedListProps;
const defaultProps = {
  ...VirtualizedList.defaultProps,
};
export type DefaultProps = typeof defaultProps;

class VariableColumnList<ItemT> extends React.PureComponent<Props<ItemT>, void> {
  static defaultProps: DefaultProps = defaultProps;
  props: Props<ItemT>;
  scrollToEnd(params?: ?{animated?: ?boolean}) {
    if (this._listRef) {
      this._listRef.scrollToEnd(params);
    }
  }

  scrollToIndex(params: {
    animated?: ?boolean,
    index: number,
    viewOffset?: number,
    viewPosition?: number,
  }) {
    if (this._listRef) {
      this._listRef.scrollToIndex(params);
    }
  }

  scrollToItem(params: {
    animated?: ?boolean,
    item: ItemT,
    viewPosition?: number,
  }) {
    if (this._listRef) {
      this._listRef.scrollToItem(params);
    }
  }

  scrollToOffset(params: {animated?: ?boolean, offset: number}) {
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

  setNativeProps(props: {[string]: mixed}) {
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

  componentDidUpdate(prevProps: Props<ItemT>) {
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
  _listRef: null | VirtualizedList;
  _virtualizedListPairs: Array<ViewabilityConfigCallbackPair> = [];
  _layoutTotalCap = 0;
  _captureRef = (ref: VirtualizedList) => {
    this._listRef = ref;
  };

  _checkProps(props: Props<ItemT>) {
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
      'VariableColumnList does not support custom data formats.'
    );
    /*
    invariant(
      !Array.isArray(columnLayout),
      'columnLayout should be an Array'
    );
    */
    invariant(
      !legacyImplementation,
      'VariableColumnList does not support legacy list'
    );
    invariant(
      !horizontal,
      'VariableColumnList does not support horizontal list'
    );
    invariant(
      !numColumns,
      'VariableColumnList does not support numColumns. Use columnLayout prop instead.'
    );
    invariant(
      !(onViewableItemsChanged && viewabilityConfigCallbackPairs),
      'VariableColumnList does not support setting both onViewableItemsChanged and ' +
        'viewabilityConfigCallbackPairs.'
    );
  }

  _getItem = (data: Array<ItemT>, index: number) => {
    const { columnLayout } = this.props;
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

  _getItemCount = (data: ?Array<ItemT>): number => {
    const { columnLayout } = this.props;
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

  _keyExtractor = (items: ItemT | Array<ItemT>, index: number) => {
    const { keyExtractor, columnLayout } = this.props;
    if (columnLayout) {
      const itemsCount = columnLayout[index % columnLayout.length];
      return items
        .map((it, kk) => keyExtractor(it, this._getItemsIndex(index, kk)))
        .join(':');
    } else {
      /* $FlowFixMe(>=0.63.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.63 was deployed. To see the error delete this
     * comment and run Flow. */
      return keyExtractor(items, index);
    }
  };

  _pushMultiColumnViewable(arr: Array<ViewToken>, v: ViewToken): void {
    const { numColumns, keyExtractor } = this.props;
    v.item.forEach((item, ii) => {
      invariant(v.index != null, 'Missing index!');
      const index = this._getItemsIndex(v.index, ii);
      arr.push({ ...v, item, key: keyExtractor(item, index), index });
    });
  }

  _createOnViewableItemsChanged(
    onViewableItemsChanged: ?(info: {
      viewableItems: Array<ViewToken>,
      changed: Array<ViewToken>,
    }) => void,
  ) {
    return (info: {
      viewableItems: Array<ViewToken>,
      changed: Array<ViewToken>,
    }) => {
      const { columnLayout } = this.props;
      if (onViewableItemsChanged) {
        if (columnLayout) {
          const changed = [];
          const viewableItems = [];
          info.viewableItems.forEach(v =>
            this._pushMultiColumnViewable(viewableItems, v)
          );
          info.changed.forEach(v => this._pushMultiColumnViewable(changed, v));
          onViewableItemsChanged({ viewableItems, changed });
        } else {
          onViewableItemsChanged(info);
        }
      }
    };
  }

  _getItemsIndex = (index: number, kk: number) => {
    const { columnLayout } = this.props;
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

  _renderItem = (info: Object) => {
    const { renderItem, columnLayout, columnWrapperStyle } = this.props;
    if (columnLayout) {
      const { item, index } = info;
      const itemsCount = columnLayout[index % columnLayout.length];
      invariant(
        Array.isArray(item),
        'Expected array of items'
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
            return element && React.cloneElement(element, { key: kk });
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
  row: { flexDirection: 'row' },
});

export default VariableColumnList;
