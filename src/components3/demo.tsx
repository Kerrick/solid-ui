import { Accessor, Component, createSignal, For } from 'solid-js';
import {
  createDisclosureContext,
  DisclosureButton,
  DisclosureContext,
  DisclosurePanel,
  DisclosureProvider,
} from './Disclosure';
import {
  createListboxContext,
  ListboxButton,
  ListboxContext,
  ListboxOption,
  ListboxOptions,
  ListboxProvider,
} from './Listbox';
import {
  createMenuContext,
  MenuButton,
  MenuContext,
  MenuItem,
  MenuItemProps,
  MenuList,
  MenuPanel,
  MenuProvider,
} from './Menu';
import { PopupButton, PopupContext, PopupOverlay, PopupPanel, PopupProvider } from './Popup';

export function Demo() {
  return (
    <>
      <PopupDemo />
      <MenuDemo />
      <ListboxDemo />
      <DisclosureDemo />
    </>
  );
}

function DisclosureDemo() {
  const context = createDisclosureContext();

  return (
    <section>
      <h1>Disclosure</h1>
      <DisclosureProvider context={context}>
        <DisclosureButton>Show Details</DisclosureButton>
        <DisclosurePanel style={{ display: context.isOpen() ? 'block' : 'none' }}>
          <p>Here are the details.</p>
        </DisclosurePanel>
      </DisclosureProvider>
    </section>
  );
}

const fruits = ['apple', 'apricot', 'orange', 'peach', 'pineapple', 'watermelon'];
function ListboxDemo() {
  const [value, setValue] = createSignal('apricot');

  return (
    <section>
      <h1>Listbox</h1>
      <ListboxProvider value={value()} onChange={setValue}>
        <ListboxButton>{value()}</ListboxButton>
        <ListboxOptions>
          <For each={fruits}>
            {(fruit) => {
              const context = createListboxContext<string>();

              return (
                <ListboxOption
                  value={fruit}
                  context={context}
                  style={context.isSelected() ? { background: 'pink' } : {}}
                >
                  {fruit}
                </ListboxOption>
              );
            }}
          </For>
        </ListboxOptions>
      </ListboxProvider>
    </section>
  );
}

function MenuDemo() {
  return (
    <section>
      <h1>Menu</h1>
      <MenuProvider>
        <MenuButton>Menu</MenuButton>
        {/* <MenuPanel>
          Panel */}
        <MenuList>
          <Item action={() => console.log('Item 1')}>Item 1</Item>
          <Item action={() => console.log('Item 2')}>Item 2</Item>
          <Item action={() => console.log('Item 3')}>Item 3</Item>
        </MenuList>
        {/* </MenuPanel> */}
      </MenuProvider>
    </section>
  );
}

const Item: Component<MenuItemProps> = (props) => {
  const context = createMenuContext();

  return (
    <MenuItem
      {...props}
      context={context}
      style={{ background: context.isActive() ? 'orange' : 'inherit' }}
    >
      {props.children}
    </MenuItem>
  );
};

function PopupDemo() {
  let context: PopupContext;

  return (
    <section>
      <h1>Popup</h1>
      <PopupProvider>
        <PopupButton>Open</PopupButton>
        <PopupOverlay />
        <PopupPanel context={(ctx) => (context = ctx)}>
          <h2>Links</h2>
          <button onClick={context.close}>Close</button>
          <ul>
            <li>
              <a href="/">Link 1</a>
            </li>
            <li>
              <a href="/">Link 2</a>
            </li>
            <li>
              <a href="/">Link 3</a>
            </li>
          </ul>
        </PopupPanel>
      </PopupProvider>
    </section>
  );
}
