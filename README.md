# react-load-script
This package simplifies loading of 3rd party scripts in your React applications.

## Motivation
There are situations when you need to use a 3rd party JS library in your React application (jQuery, D3.js for rendering charts, etc.) but you don't need it everywhere and/or you want to use it only in a response to users actions. In cases like this, preloading the whole library when application starts is an unnecessary and expensive operation which could possibly slow down your application.

Using the `Script` component this package provides you with, you can easily load any 3rd party scripts your applications needs directly in a relevant component and show a placeholder while the script is loading (e.g. a loading animation). As soon as the script is fully loaded, a callback function you'll have passed to `Script` is called (see example below).

##API
The package exports a single component with the following props:

### `onCreate`
Called as soon as the script tag is created.

### `onError` (required)
Called in case of an error with the script.

### `onLoad` (required)
Called when the requested script is fully loaded.

### `url` (required)
URL pointing to the script you want to load.

## Example
You can use the following code to load jQuery in your app:

```jsx
import Script from 'react-load-script'

...

render() {
  return (
    <Script
      url="https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"
      onCreate={this.handleScriptCreate.bind(this)}
      onError={this.handleScriptError.bind(this)}
      onLoad={this.handleScriptLoad.bind(this)}
    />
  )
}

...

handleScriptCreate() {
  this.setState({ scriptLoaded: false })
}

handleScriptError() {
  this.setState({ scriptError: true })
}

handleScriptLoad() {
  this.setState({ scriptLoaded: true })
}

```

## License
MIT 2016

## Made with love by
[![](https://camo.githubusercontent.com/d88ee6842f3ff2be96d11488aa0d878793aa67cd/68747470733a2f2f7777772e676f6f676c652e636f6d2f612f626c75656265727279617070732e636f6d2f696d616765732f6c6f676f2e676966)](https://www.blueberry.io)
