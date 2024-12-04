# ✅ Turbo Apex Debug

Turbo Apex Debug enhances your Salesforce debugging by allowing you to customize log prefixes, delimiters, and automatically include details like line numbers and method names. Streamline your debugging with options for both manual and automated setups, tailored to your needs.

---

[![ex.gif](https://i.postimg.cc/N0Td6zgq/ex.gif)](https://postimg.cc/cKx7ZTgX)

## Supported file extensions:

- .cls
- .trigger
- .apex

## Features

- **Customizable Prefixes**: Define your own set of prefixes for log and error messages.
- **Automatic Detail Inclusion**: Easily include line numbers, entity names, and method names in your debug statements.
- **Flexible Delimiters**: Set your preferred delimiter to separate prefixes from messages.
- **Manual or Randomized Prefix Selection**: Choose prefixes manually or let the extension select them randomly from your list.

## Commands

- Turbo Apex Debug: Log;
  Command: `turbo-apex-debug.log`;
  Shortcut: `ctrl+alt+l`;
- Turbo Apex Debug: Remove all logs;
  Command: `turbo-apex-debug.removeAll`;
  Shortcut: `ctrl+alt+d`.

## Changing Default Shortcut

You can always change command's keybinding by going to `ctrl+shift+p` -> `Preferences: Open Keyboard Shortcuts` -> `turbo-apex-debug`

## Configuration Options

Adjust settings in your `settings.json` file or use the Settings UI to customize your debugging experience.

- `turboApexDebug.logMessagePrefixes`
  Customize the prefixes that appear before your debug messages. These symbols help you quickly identify the nature of the log entry. Leave empty if no prefix is needed.

- `turboApexDebug.errorMessagePrefixes`
  Define specific prefixes for error messages. Leave empty if no prefix is needed.

- `turboApexDebug.logMessageDelimiter`
  Specify the character or symbol that separates the log statement.

- `turboApexDebug.promptPrefix`
  Enable this option to manually select a prefix for your debug messages when prompted. When disabled, a random prefix will be chosen from the provided list, if available.

- `turboApexDebug.includeLineNum`
  Automatically include the line number in debug statements.

- `turboApexDebug.includeEntityName`
  Automatically include the entity name (class or trigger) in debug statements.

- `turboApexDebug.includeMethodName`
  Automatically include the method name in debug statements. Disabled for triggers.

## Pro Tip!

If you use [Turbo Console Log](https://marketplace.visualstudio.com/items?itemName=ChakrounAnas.turbo-console-log) for `.js`/`.ts` files, you can configure a single shortcut to work with both Turbo Console Log and Turbo Apex Debug:

1. Open `keybindings.json` (`ctrl+shift+p` -> `Preferences: Open Keyboard Shortcuts (JSON)`)
2. Add the following:

```json
  {
    "key": "ctrl+alt+l",
    "command": "turboConsoleLog.displayLogMessage",
    "when": "resourceExtname != '.cls' && resourceExtname != '.trigger' && resourceExtname != '.apex'"
  },
  {
    "key": "ctrl+alt+l",
    "command": "turbo-apex-debug.log",
    "when": "resourceExtname != '.js' && resourceExtname != '.ts'"
  },
  {
    "key": "ctrl+alt+d",
    "command": "turboConsoleLog.deleteAllLogMessages",
    "when": "resourceExtname != '.cls' && resourceExtname != '.trigger' && resourceExtname != '.apex'"
  },
  {
    "key": "ctrl+alt+d",
    "command": "turbo-apex-debug.removeAll",
    "when": "resourceExtname != '.js' && resourceExtname != '.ts'"
  }
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue on the [GitHub repository](https://github.com/DeveloperEstiven/turbo-apex-debug) to report bugs, suggest features, or ask questions.
