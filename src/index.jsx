import React from 'react';
import { PropTypes as RPT } from 'prop-types';

export default class Script extends React.Component {

  static propTypes = {
    attributes: RPT.object, // eslint-disable-line react/forbid-prop-types
    onCreate: RPT.func,
    onError: RPT.func.isRequired,
    onLoad: RPT.func.isRequired,
    url: RPT.string.isRequired,
    children: RPT.string,
  };

  static defaultProps = {
    attributes: {},
    onCreate: () => {},
    onError: () => {},
    onLoad: () => {},
    children: undefined,
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
    const { onCreate, url, attributes, children } = this.props;
    const script = document.createElement('script');

    onCreate();

    // add 'data-' or non standard attributes to the script tag
    if (attributes) {
      Object.keys(attributes).forEach(prop => script.setAttribute(prop, attributes[prop]));
    }

    script.src = url;

    // default async to true if not set with custom attributes
    if (!script.hasAttribute('async')) {
      script.async = 1;
    }

    // put data inside the script tag, so script can use them (linkedin share use case)
    if (children) {
      script.innerHTML = children;
    }

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
