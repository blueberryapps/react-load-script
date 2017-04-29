import invariant from 'invariant';
import React from 'react';
import { PropTypes as RPT } from 'prop-types';

export default class Script extends React.Component {

  static propTypes = {
    onCreate: RPT.func, // eslint-disable-line react/no-unused-prop-types
    onError: RPT.func.isRequired, // eslint-disable-line react/no-unused-prop-types
    onLoad: RPT.func.isRequired, // eslint-disable-line react/no-unused-prop-types
    url: RPT.string.isRequired,
  };

  static defaultProps = {
    onCreate: () => {},
  }

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
  }

  componentDidMount() {
    const { url } = this.props;

    if (this.constructor.loadedScripts[url]) {
      this.runCallback('onLoad');
      return;
    }

    if (this.constructor.erroredScripts[url]) {
      this.runCallback('onError');
      return;
    }

    // If the script is loading, add the component to the script's observers
    // and return. Otherwise, initialize the script's observers with the component
    // and start loading the script.
    if (this.constructor.scriptObservers[url]) {
      this.constructor.scriptObservers[url][this.scriptLoaderId] = this.runCallback.bind(this);
      return;
    }

    this.constructor.scriptObservers[url] = { [this.scriptLoaderId]: this.runCallback.bind(this) };

    this.createScript();
  }

  componentWillUnmount() {
    const { url } = this.props;
    const observers = this.constructor.scriptObservers[url];

    // If the component is waiting for the script to load, remove the
    // component from the script's observers before unmounting the component.
    if (observers) {
      delete observers[this.scriptLoaderId];
    }
  }

  createScript() {
    const { url } = this.props;
    const script = document.createElement('script');

    this.runCallback('onCreate', false);

    script.src = url;
    script.async = 1;

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
        observer('onLoad');
        return true;
      });
    };

    script.onerror = () => {
      this.constructor.erroredScripts[url] = true;
      callObserverFuncAndRemoveObserver((observer) => {
        observer('onError');
        return true;
      });
    };

    document.body.appendChild(script);
  }

  runCallback(type, required = true) {
    const callback = this.props[type];

    invariant(
      !required || typeof callback === 'function',
      `Callback ${type} must be function, got "${typeof callback}" instead`,
    );

    return callback && callback();
  }

  render() {
    return null;
  }
}
