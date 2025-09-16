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
- Characters: flips to the character manager view when you click it
### each button should make a random gunshot sound when you click it
- randomly change the pitch and duration of single-gunshot-54-40780.mp3 on each click
- clicking a button should interrupt any currently playing gunshot and start another one
## mysterious western ghosttown music

## history management
### keep a history array of objects so the user can visit them with the browser's back and forward buttons
- the browser's forward and back buttons are enabled only if there are objects available to visit
- each object knows what view to display when visiting the object with the browser's back and forward buttons
- when the user goes back in the history array with the browser's back button history
  - they can use the forward button to advance in the history array to edit that object
  - or they can use the UI to edit a different object
    - this deletes the objects in the "future" of the history array and pushes the new object in the array
