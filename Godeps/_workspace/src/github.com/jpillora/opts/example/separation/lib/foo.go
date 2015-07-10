package lib

import "errors"

//this Config struct can used both by opts to parse CLI input
//and by library users who wish to use this code in their programs
type Config struct {
	Ping string
	Pong string
	Zip  int
	Zop  int
}

//use a Config value, not Config pointer.
//this prevents modification from outside the library.
func NewFoo(c Config) (*Foo, error) {
	//validate config
	if c.Zip < 7 {
		return nil, errors.New("Zip too small!")
	}
	//ensure proper initialization of Foo
	foo := &Foo{
		c:    c,
		bar:  42 + c.Zip,
		bazz: 21 + c.Zop,
	}

	return foo, nil
}

type Foo struct {
	//internal config
	c Config
	//internal state
	bar  int
	bazz int
}

func (f *Foo) Run() {
	println("Foo is running...")
}
