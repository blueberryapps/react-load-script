import React from 'react';
import { shallow } from 'enzyme';
import Script from './index';

const props = {
  onCreate: jest.fn(),
  onError: jest.fn(),
  onLoad: jest.fn(),
  url: 'dummy',
};

let wrapper;

beforeEach(() => {
  wrapper = shallow(<Script {...props} />);
});

test('renders null', () => {
  expect(wrapper.type()).toBe(null);
});
