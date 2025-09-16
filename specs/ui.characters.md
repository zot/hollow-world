# character editing for the Hollow World single page webapp
# based on ../claude.md
# use SOLID principals
# make unit tests

# Character manager view
## the browser back button navigates back to the previous screen
## track a persistent list of characters
## show a list of characters with an "Add character" button underneath
### each character is keyed by the UUID used to store it
### each character shows the name with abbreviated stats underneath and a delete button on the right (skull and crossbones)
### the user can click a character item in the list
- this flips to the character editor view, passing the UUID to it in the URL path

# Character editor view
## creating the history item for this view when called from the character manager view
- load the character from storage based on the UUID in the URL path
- edit it live as the "current" character but don't persist anything until the user clicks the "Yep" button
## revisiting a history item when called from the browser back or forward button
- edit the history item live as the "current" cuaracter but don't persist anything until the user clicks the "Yep" button
## Display the current character's stats in stylish, old-timey, labled fields that let you edit the values
## Show a "Nope" button at the bottom-left and a "Yep" button at the bottom-right
### "Nope" button
- reloads the character from storage and displays the stats in the fields
- overwrites the character item in the history array with the retrieved object
### "Yep" button
- loads the character from storage and keep it in a temporary variable
- saves the current character to storage
- replace the history object with the original that is in the temporary variable
- remove any "future" items in the history and add the newly saved character to the history
- advance the internal history so that pressing the browser's back button will return to the history object that was in the temporary variable
