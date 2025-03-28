const moment = require('moment')
const he = require('he');
module.exports = {
  formatDate: function (date, format) {
    return moment(date).utc().format(format)
  },
  stripTags: function (input) {
    return input.replace(/<(?:.|\n)*?>/gm, '')
  },
  truncate: function (str, len) {
    if (!str) return ''; // Handle null or undefined

    str = he.decode(str); // Decode HTML entities (like &rsquo; -> ’)
    str = str.replace(/\s+/g, ' ').trim(); // Remove extra spaces/newlines

    if (str.length > len) {
        let new_str = str.substring(0, len);
        let lastSpace = new_str.lastIndexOf(' ');

        if (lastSpace > 0) {
            new_str = new_str.substring(0, lastSpace);
        }

        return new_str + '...';
    }
    return str;
},
  
editIcon: function (storyUser, loggedUser, storyId, floating = true) {
  if (!storyUser || !loggedUser || !storyId) {
      console.error("Missing parameters in editIcon helper", { storyUser, loggedUser, storyId });
      return '';
  }

  if (storyUser?._id?.toString() === loggedUser?._id?.toString()) {
      if (floating) {
          return `<a href="/stories/edit/${storyId}" class="btn-floating halfway-fab blue"><i class="fas fa-edit fa-small"></i></a>`;
      } else {
          return `<a href="/stories/edit/${storyId}"><i class="fas fa-edit"></i></a>`;
      }
  }
  return '';
},
  select: function (selected, options) {
    return options
      .fn(this)
      .replace(
        new RegExp(' value="' + selected + '"'),
        '$& selected="selected"'
      )
      .replace(
        new RegExp('>' + selected + '</option>'),
        ' selected="selected"$&'
      )
  },
}