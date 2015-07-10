# opts

**A low friction command-line interface library for Go (Golang)**

[![GoDoc](https://godoc.org/github.com/jpillora/opts?status.svg)](https://godoc.org/github.com/jpillora/opts)

### Overview

Command-line parsing should be easy. We shouldn't be forced to keep our configuration in sync with our command-line flags. `opts` attempts solve this with the goal of being as low friction as possible:

``` go
opts.Parse(&foo)
```

Internally, `opts` creates `flag.FlagSet`s from your configuration structs using `pkg/reflect`. So, given the following program:

``` go
type FooConfig struct {
	Alpha   string        `help:"a string"`
	Bravo   int           `help:"an int"`
	Charlie bool          `help:"a bool"`
	Delta   time.Duration `help:"a duration"`
}

foo := FooConfig{
	Bravo: 42,
	Delta: 2 * time.Minute,
}

opts.Parse(&foo)
```

`opts` would *approximately* perform:

``` go
foo := FooConfig{}
set := flag.NewFlagSet("FooConfig")
set.StringVar(&foo.Alpha, "", "a string")
set.IntVar(&foo.Bravo, 42, "an int")
set.BoolVar(&foo.Charlie, false, "a bool")
set.DurationVar(&foo.Delta, 2 * time.Minute, "a duration")
set.Parse(os.Args)
```

And, you get pretty `--help` output:

```
$ ./foo --help

  Usage: foo [options]

  Options:
  --alpha, -a    a string
  --bravo, -b    an int (default 42)
  --charlie, -c  an bool
  --delta, -d    a duration (default 2m0s)
  --help, -h

```

### Features (with examples)

* Easy to use ([simple](example/simple/))
* Promotes separation of CLI code and library code ([separation](example/separation/))
* Automatically generated `--help` text via struct tags `help:"Foo bar"` ([help](example/help/))
* Subcommands by nesting structs ([subcmds](example/subcmds/))
* Default values by modifying the struct prior to `Parse()` ([defaults](example/defaults/))
* Default values from a JSON config file, unmarshalled via your config struct ([config](example/config/))
* Default values from environment, defined by your field names ([env](example/env/))
* Infers program name from package name (and optional repository link)
* Extensible via `flag.Value` ([customtypes](example/customtypes/))
* Customizable help text by modifying the default templates ([customhelp](example/customhelp/))

### [Simple Example](example/simple)

``` go 
package main

import (
	"fmt"

	"github.com/jpillora/opts"
)

type Config struct {
	Foo string
	Bar string
}

func main() {
	c := Config{}
	opts.Parse(&c)
	fmt.Println(c.Foo)
	fmt.Println(c.Bar)
}
```

```
$ ./myprog --foo hello --bar world
hello
world
```

``` plain 
$ ./myprog --help

  Usage: myprog [options]
  
  Options:
  --foo, -f 
  --bar, -b 
  --help, -h
  
```

### All Examples

#### See all [example](example/)s here

### Struct Tag API

`opts` relies on struct tags to "compile" your flag set. Since there are defaults in all cases however, `opts` use any struct as as a flag set, even with no struct tags defined. A struct field can contain any number of struct tag properties. These come in the form:

```
A int `foo:"bar" ping:"pong"`
```

Below are the various properties available:

#### **Common properties**

* `name` - Name is used to display the field in the help text (defaults to the field name converted to lowercase and dashes)
* `help` - Help is used to describe the field (defaults to "")
* `type` - The `opts` type assigned the field (defaults using the table below)

#### `type` defaults

Each field **must** have a `type`. By default a struct field will be assigned a `type` depending on the field type:

| Field Type    | Opt Type      |
| ------------- |:-------------:|
| int           | opt           |
| string        | opt           |
| bool          | opt           |
| flag.Value    | opt           |
| time.Duration | opt           |
| []string      | arglist       |
| struct        | subcmd        |

This default assignment can be overruled with a `type` struct tags. For example you could set a string struct field to be an `arg` field with `type:"arg"`.

#### `type` list and type specific properties

* **`opt`**

	An option (`opt`) field will appear in the options list and by definition, be optional.

	* `short` - An alias or shortcut to this option (defaults to the first letter of the `name` property)
	* `env` - An environment variable to use to retrieve the default (**when `UseEnv()` is set** this defaults to `name` property converted to uppercase and underscores)

	Restricted to fields with type `int`,`string`,`bool`,`time.Duration` and `flag.Value`

* **`arg`**

	An argument (`arg`) field will appear in the usage and will be required if it does not have a default value set.

	Restricted to fields with type `string`

* **`arglist`**

	An argument list (`arglist`) field will appear in the usage. Useful for a you allow any number number of arguments. For example file and directory targets.

	* `min` - An integer representing the minimum number of args specified

	Restricted to fields with type `[]string`

* **`subcmd`**

	A subcommand is nested `opts.Opt` instance, so its fields behave in exactly the same way as the parent struct.

	You can access the options of a subcommand with `prog --prog-opt X subcmd --subcmd-opt Y`

	Restricted to fields with type `struct`

* **`cmdname`**

	A special type which will assume the name of the selected subcommand

	Restricted to fields with type `string`

* **`embedded`**

	A special type which causes the fields of struct to be used in the current struct. Useful if you want to extend existing structs with extra command-line options.

### Other projects

Other CLI libraries which infer flags from struct tags:

* https://github.com/jessevdk/go-flags is similar though it still could be simpler and more customizable.

### Todo

* More tests
* Option groups (Separate sets of options in `--help`)
* Bash completion
* Multiple short options `-aux` (Requires a non-`pkg/flag` parser)

#### MIT License

Copyright © 2015 &lt;dev@jpillora.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
