import { mergeProps, onMount, splitProps } from 'solid-js';
import { List, ListProps } from '~/components/List';
import { ListOrientation, useListActions } from '~/components/List/context';
import { usePopoverState } from '~/components/Popover/context';
import { BaseComponent } from '~/types';
import Panel from './Panel';

type ItemsProps = {
  as?: string | BaseComponent<ListProps>;
  'aria-labelledby'?: string;
  'aria-orientation'?: ListOrientation;
  dataAttribute?:
    | 'data-solid-menu-items'
    | 'data-solid-listbox-options'
    | 'data-solid-combobox-options';
  dataAttributePanel?:
    | 'data-solid-menu-panel'
    | 'data-solid-listbox-panel'
    | 'data-solid-combobox-panel';
  role?: 'menu' | 'listbox';
};

const Items: BaseComponent<ItemsProps> = (props) => {
  props = mergeProps(
    {
      as: 'div',
      dataAttribute: 'data-solid-menu-items',
      dataAttributePanel: 'data-solid-menu-panel',
      role: 'menu',
    },
    props
  );

  const ListActions = useListActions();

  onMount(() => {
    if (props['aria-orientation']) {
      ListActions.registerOrientation(props['aria-orientation']);
    }
  });

  const [localProps, otherProps] = splitProps(props, [
    'as',
    'aria-labelledby',
    'aria-orientation',
    'dataAttribute',
    'dataAttributePanel',
    'role',
  ]);

  const PopoverState = usePopoverState();

  const renderList = () => (
    <List
      {...otherProps}
      as={localProps.as}
      aria-labelledby={localProps['aria-labelledby']}
      aria-orientation={localProps['aria-orientation']}
      dataAttribute={localProps.dataAttribute}
      role={localProps.role}
    />
  );

  return PopoverState.panelId ? (
    renderList()
  ) : (
    <Panel dataAttribute={localProps.dataAttributePanel}>{renderList()}</Panel>
  );
};

export default Items;
