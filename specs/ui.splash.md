# The splash screen for the Hollow World game
# based on ../claude.md
# use SOLID principals
# make unit tests

# Initial screen for the game
## old timey western look with sancreek font, like a dime novel
## unless specified, nothing is user-selectable
## display "Don't Go Hollow" in a large old-west-style font; the word "Hollow" should have a green glow but still with sancreek font
- text is medium-light brown
## display the peer ID, selectable by the user
## buttons
- Join Game
- Start Game
### each button should make a random gunshot sound when you click it
- randomly change the pitch and duration of single-gunshot-54-40780.mp3 on each click
- clicking a button should interrupt any currently playing gunshot and start another one

## mysterious western ghosttown music
