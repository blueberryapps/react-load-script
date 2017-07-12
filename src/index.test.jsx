/* global document */

import React from 'react';
import { shallow } from 'enzyme';
import Script from './index';

let props;
let wrapper;

beforeEach(() => {
  props = {
    onCreate: jest.fn(),
    onError: jest.fn(),
    onLoad: jest.fn(),
    url: 'dummy',
    attributes: {
      id: 'dummyId',
      dummy: 'non standard',
      'data-dummy': 'standard',
      async: 'false',
    },
  };
  wrapper = shallow(<Script {...props} />);
});

test('renders null', () => {
  expect(wrapper.type()).toBe(null);
});

// constructor
test('constructor should assign incrementing scriptLoaderId', () => {
  wrapper.instance().constructor.idCount = 0;
  wrapper = shallow(<Script {...props} />);
  expect(wrapper.instance().scriptLoaderId).toBe('id0');

  wrapper = shallow(<Script {...props} />);
  expect(wrapper.instance().scriptLoaderId).toBe('id1');

  wrapper = shallow(<Script {...props} />);
  expect(wrapper.instance().scriptLoaderId).toBe('id2');
});

// componentDidMount
test('componentDidMount should run onLoad callback if script already loaded', () => {
  wrapper.instance().constructor.loadedScripts[props.url] = true;
  wrapper.instance().componentDidMount();
  expect(props.onLoad.mock.calls.length).toBe(1);
});

test('componentDidMount should not run onLoad callback if script not yet loaded', () => {
  wrapper.instance().constructor.loadedScripts[props.url] = false;
  wrapper.instance().componentDidMount();
  expect(props.onLoad.mock.calls.length).toBe(0);
});

test('componentDidMount should run onError callback if script has errored', () => {
  wrapper.instance().constructor.erroredScripts[props.url] = true;
  wrapper.instance().componentDidMount();
  expect(props.onError.mock.calls.length).toBe(1);
});

test('componentDidMount should not run onError callback if script has not errored', () => {
  wrapper.instance().constructor.erroredScripts[props.url] = false;
  wrapper.instance().componentDidMount();
  expect(props.onError.mock.calls.length).toBe(0);
});

test('componentDidMount: if the script is already loading, props should be passed to the observer', () => {
  wrapper.instance().constructor.scriptObservers[props.url] = {};
  wrapper.instance().scriptLoaderId = 'id0';
  wrapper.instance().componentDidMount();
  expect(wrapper.instance().constructor.scriptObservers[props.url].id0).toMatchObject(props);
});

// componentWillUnmount
test('componentWillUnmount should delete observers for the loader', () => {
  wrapper.instance().constructor.scriptObservers[props.url] = {
    [wrapper.instance().scriptLoaderId]: 'props',
  };
  const getObserver = () =>
    wrapper.instance().constructor.scriptObservers[props.url][wrapper.instance().scriptLoaderId];
  expect(getObserver()).toBe('props');
  wrapper.instance().componentWillUnmount();
  expect(getObserver()).toBe(undefined);
});

test('custom attributes should be set on the script tag', () => {
  const script = document.getElementById('dummyId');
  expect(script.getAttribute('id')).toBe('dummyId');
  expect(script.getAttribute('dummy')).toBe('non standard');
  expect(script.getAttribute('data-dummy')).toBe('standard');
  expect(script.getAttribute('async')).toBe('false');
});
