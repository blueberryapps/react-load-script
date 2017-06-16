import React from 'react';
import { PropTypes as RPT } from 'prop-types';

import * as shortid from 'shortid';

export default class Script extends React.Component {

  static propTypes = {
    onCreate: RPT.func,
    onError: RPT.func.isRequired,
    onLoad: RPT.func.isRequired,
    onUnload: RPT.func.isRequired,
    url: RPT.string.isRequired,
  };

  static defaultProps = {
    onCreate: () => null,
    onError: () => null,
    onLoad: () => null,
    onUnload: () => null,
  };

  // A dictionary mapping script URLs to a dictionary mapping
  // component key to component for all components that are waiting
  // for the script to load.
  static scriptObservers = {};

  // A dictionary mapping script URL to a boolean value indicating if the script
  // has already been loaded.
  static loadedScripts = {};

  // A dictionary mapping script URL to a boolean value indicating if the script
  // has failed to load.
  static erroredScripts = {};

  // A counter used to generate a unique id for each component that uses
  // ScriptLoaderMixin.
  static idCount = 0;

  constructor(props) {
    super(props);
    this.scriptLoaderId = `id${this.constructor.idCount++}`; // eslint-disable-line space-unary-ops, no-plusplus
    this.pkID = `script-${shortid.generate()}`;
    this.unmount = () => {
      const { url, onUnload } = this.props;
      const observers = this.constructor.scriptObservers[url];
      const loaded = this.constructor.loadedScripts[url];
      const errored = this.constructor.erroredScripts[url];

      // If the component is waiting for the script to load, remove the
      // component from the script's observers before unmounting the component.
      if (observers) {
        delete observers[this.scriptLoaderId];
        // delete (this.constructor.scriptObservers)[url];
      }

      // If this script has been previously loaded
      if (loaded) {
        delete (this.constructor.loadedScripts)[url];
        const s = document.querySelector(`[data-pkID="${this.pkID}"]`);
        s.parentNode.removeChild(s);
        onUnload();
      }

      // If this script has been previously errored
      if (errored) {
        delete (this.constructor.erroredScripts)[url];
      }
    };
    this.generate = () => {
      const { onError, onLoad, url } = this.props;
      if (this.constructor.loadedScripts[url]) {
        onLoad();
        return;
      }

      if (this.constructor.erroredScripts[url]) {
        onError();
        return;
      }

      // If the script is loading, add the component to the script's observers
      // and return. Otherwise, initialize the script's observers with the component
      // and start loading the script.
      if (this.constructor.scriptObservers[url]) {
        this.constructor.scriptObservers[url][this.scriptLoaderId] = this.props;
        return;
      }

      this.constructor.scriptObservers[url] = { [this.scriptLoaderId]: this.props };

      this.createScript();
    };
  }

  componentDidMount() {
    this.generate();
  }

  shouldComponentUpdate(nextProps) {
    let r = false;
    Object.keys(this.props).forEach((k) => {
      if (r) return;
      if (
        this.props[k] !== nextProps[k] &&
        !(typeof this.props[k] === 'function' && typeof nextProps[k] === 'function')
      ) {
        r = true;
      }
    });
    return r;
  }

  componentWillUpdate() {
    this.unmount();
  }

  componentDidUpdate() {
    this.generate();
  }

  componentWillUnmount() {
    this.unmount();
  }

  createScript() {
    const { onCreate, url } = this.props;
    const { pkID } = this;
    const script = document.createElement('script');

    onCreate();

    script.src = url;
    script.async = 1;
    script.setAttribute('data-pkID', pkID);

    const callObserverFuncAndRemoveObserver = (shouldRemoveObserver) => {
      const observers = this.constructor.scriptObservers[url];
      Object.keys(observers).forEach((key) => {
        if (shouldRemoveObserver(observers[key])) {
          delete this.constructor.scriptObservers[url][this.scriptLoaderId];
        }
      });
    };
    script.onload = () => {
      this.constructor.loadedScripts[url] = true;
      callObserverFuncAndRemoveObserver((observer) => {
        observer.onLoad();
        return true;
      });
    };

    script.onerror = () => {
      this.constructor.erroredScripts[url] = true;
      callObserverFuncAndRemoveObserver((observer) => {
        observer.onError();
        return true;
      });
    };

    document.body.appendChild(script);
  }

  render() {
    return null;
  }
}
