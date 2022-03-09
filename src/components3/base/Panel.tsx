import {
  Accessor,
  Component,
  createContext,
  createEffect,
  JSX,
  onCleanup,
  onMount,
  PropsWithChildren,
  useContext,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import { Portal } from 'solid-js/web';
import { createComponentContext, setRef, useId } from '~/utils/componentUtils';
import { useOnClickAway } from '~/utils/eventUtils';
import { getFirstFocusableElement, useFocusOnOpen, useFocusTrap } from '~/utils/focusUtils';
import { usePopperContext } from '../Popper';
import { useActiveItemState } from './ActiveItem';

type PanelElementIds = {
  buttonId: string;
  panelId: string;
  overlayId: string;
};

export type PanelRole = 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | 'none';

export type PanelState = PanelElementIds & {
  role: PanelRole;
  shouldShowPanel: boolean;
  isPanelOpen: boolean;
  isOverlayOpen: boolean;
};

export type PanelActions = {
  setElementId(name: keyof PanelElementIds, id: string): void;
  openPanel(): void;
  closePanel(): void;
  togglePanel(): void;
  openOverlay(): void;
  closeOverlay(): void;
};

export type PanelContext = Readonly<{
  isOpen: Accessor<boolean>;
  open: () => void;
  close: () => void;
}>;

export const createPanelContext = () => createComponentContext<PanelContext>();

export function createExternalContext(): PanelContext {
  const state = usePanelState();
  const actions = usePanelActions();

  return {
    isOpen: () => state.isPanelOpen,
    open: () => actions.openPanel(),
    close: () => actions.closePanel(),
  } as const;
}

export type PanelContextProp = {
  context?: (ctx: PanelContext) => void;
};

const PanelComponentContext = createContext<{ state: PanelState; actions: PanelActions }>();
export function usePanelState() {
  return useContext(PanelComponentContext).state;
}
export function usePanelActions() {
  return useContext(PanelComponentContext).actions;
}

export type PanelProviderProps = PropsWithChildren<
  PanelContextProp & {
    role?: PanelRole;
  }
>;

export function PanelProvider(props: PanelProviderProps) {
  const [state, setState] = createStore<PanelState>({
    buttonId: null,
    overlayId: null,
    panelId: null,
    get role(): PanelRole {
      return props.role;
    },
    shouldShowPanel: false,
    get isPanelOpen(): boolean {
      return state.shouldShowPanel && (!state.overlayId || state.isOverlayOpen);
    },
    isOverlayOpen: false,
  });

  const actions: PanelActions = {
    setElementId(name, id) {
      setState({ [name]: id });
    },
    openPanel() {
      setState('shouldShowPanel', true);
    },
    closePanel() {
      setState('shouldShowPanel', false);
    },
    togglePanel() {
      setState('shouldShowPanel', (state) => !state);
    },
    openOverlay() {
      setState({ isOverlayOpen: true });
    },
    closeOverlay() {
      setState({ isOverlayOpen: false });
    },
  };

  return (
    <PanelComponentContext.Provider value={{ state, actions }}>
      {(() => {
        props.context?.(createExternalContext());
        return props.children;
      })()}
    </PanelComponentContext.Provider>
  );
}

export type PanelButtonProps<PanelButtonElement extends HTMLElement> = {
  'aria-controls': string;
  'aria-expanded': boolean;
  'aria-haspopup': PanelRole;
  onClick: JSX.EventHandler<PanelButtonElement, MouseEvent>;
  onKeyDown: JSX.EventHandler<PanelButtonElement, KeyboardEvent>;
};

export function createPanelButtonAriaProps() {
  const panelState = usePanelState();

  return {
    get ['aria-controls']() {
      return panelState.panelId;
    },
    get ['aria-expanded']() {
      return panelState.isPanelOpen;
    },
    get ['aria-haspopup']() {
      return panelState.role;
    },
  };
}

export function createPanelButtonProps<PanelButtonElement extends HTMLElement>(
  config: {
    id?: string;
  } = {}
): PanelButtonProps<PanelButtonElement> {
  const panelState = usePanelState();
  const panelActions = usePanelActions();

  if (config.id) {
    onMount(() => {
      if (!panelState.buttonId) {
        panelActions.setElementId('buttonId', config.id);
      }

      const popper = usePopperContext();

      if (!popper?.refs.anchor && config.id === panelState.buttonId) {
        popper?.setRef('anchor', document.getElementById(config.id));
      }
    });

    createEffect<typeof panelState.isPanelOpen>((wasPanelOpen) => {
      if (wasPanelOpen && !panelState.isPanelOpen && config.id === panelState.buttonId) {
        document.getElementById(config.id)?.focus();
      }
      return panelState.isPanelOpen;
    });
  }

  const activeDescendentState = useActiveItemState();

  return {
    get ['aria-controls']() {
      return panelState.panelId;
    },
    get ['aria-expanded']() {
      return panelState.isPanelOpen;
    },
    get ['aria-haspopup']() {
      return panelState.role;
    },
    onClick() {
      panelActions.togglePanel();
    },
    onKeyDown(event) {
      if (event.key === 'Escape') {
        panelActions.closePanel();
      } else if (activeDescendentState && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        panelActions.openPanel();
      }
    },
  };
}

export type PanelProps<PanelElement extends HTMLElement> = {
  onKeyDown: JSX.EventHandler<PanelElement, KeyboardEvent>;
  ref: (element: PanelElement) => void;
  role: PanelRole;
  tabIndex: string | number;
};

export type CreatePanelPropsConfig<PanelElement extends HTMLElement> = {
  clickAway?:
    | boolean
    | {
        exceptions?: HTMLElement[];
        onClickAway?: () => void;
      }
    | ((element: PanelElement) => void);
  id: string;
  manageFocus?:
    | boolean
    | {
        focusTrapRef?: HTMLElement;
        initialFocusRef?: HTMLElement;
      }
    | ((element: PanelElement) => void);
  ref?: PanelElement | ((element: PanelElement) => void);
  tabIndex?: string | number;
};

export function createPanelProps<PanelElement extends HTMLElement>(
  config: CreatePanelPropsConfig<PanelElement>
): PanelProps<PanelElement> {
  const panelState = usePanelState();

  let panelRef: PanelElement;

  createEffect(() => {
    if (panelState.isPanelOpen) {
      if (typeof config.manageFocus === 'function') {
        config.manageFocus(panelRef);
      } else if (config.manageFocus) {
        const panelState = usePanelState();
        const manageFocus = config.manageFocus === true ? {} : config.manageFocus;

        useFocusTrap(
          manageFocus.focusTrapRef || panelRef,
          () => panelState.isPanelOpen,
          manageFocus.initialFocusRef
        );
        useFocusOnOpen(
          manageFocus.initialFocusRef || getFirstFocusableElement(panelRef),
          () => panelState.isPanelOpen
        );
      }

      if (typeof config.clickAway === 'function') {
        config.clickAway(panelRef);
      } else if (config.clickAway) {
        const panelState = usePanelState();
        const panelActions = usePanelActions();
        const clickAway = config.clickAway === true ? {} : config.clickAway;
        const { exceptions = [], onClickAway } = clickAway;

        const button = document.getElementById(panelState.buttonId);
        if (button) {
          exceptions.push(button);
        }

        useOnClickAway(
          panelRef,
          () => {
            panelActions.closePanel();
            onClickAway?.();
          },
          {
            exceptions,
            shouldContainActiveElement: !config.manageFocus,
          }
        );
      }
    }
  });

  function ref(element: PanelElement) {
    usePopperContext()?.setRef('popper', element);
    panelRef = element;
    setRef(config.ref, element);
  }

  const panelActions = usePanelActions();

  onMount(() => {
    panelActions.setElementId('panelId', config.id);
  });

  return {
    onKeyDown(event) {
      if (event.key === 'Escape') {
        panelActions.closePanel();
      }
    },
    ref,
    get role() {
      return panelState.role;
    },
    tabIndex: config.tabIndex ?? (config.manageFocus ? 0 : undefined),
  };
}

export const OverlayPortal: Component = (props) => {
  const actions = usePanelActions();

  onMount(actions.openOverlay);
  onCleanup(actions.closeOverlay);

  return <Portal>{props.children}</Portal>;
};

export function createPanelOverlayProps(config: { id: string }) {
  const panelActions = usePanelActions();

  onMount(() => {
    panelActions.setElementId('overlayId', config.id);
  });

  return {};
}
