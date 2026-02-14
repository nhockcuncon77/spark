package logger

import (
	"github.com/fatih/color"
)

func (l *Logger) Startup(ver string) {
	c := color.New(color.FgCyan).Add(color.Underline)
	color.RGB(174, 52, 235).Print(`
________  ___       ___  ________   ________  ___           ___    ___
|\   __  \|\  \     |\  \|\   ___  \|\   ___ \|\  \         |\  \  /  /|
\ \  \|\ /\ \  \    \ \  \ \  \\ \  \ \  \_|\ \ \  \        \ \  \/  / /
\ \   __  \ \  \    \ \  \ \  \\ \  \ \  \ \\ \ \  \        \ \    / /
 \ \  \|\  \ \  \____\ \  \ \  \\ \  \ \  \_\\ \ \  \____    \/  /  /
  \ \_______\ \_______\ \__\ \__\\ \__\ \_______\ \_______\__/  / /
   \|_______|\|_______|\|__|\|__| \|__|\|_______|\|_______|\___/ /
                                                          \|___|/
`)
	c.Printf("Spark v(%s)\n", ver)
	color.Green("Server started on 9000")
	color.Green("Graphql running on port 7777")
	color.Green("GoFiber running on port 8080")
}
