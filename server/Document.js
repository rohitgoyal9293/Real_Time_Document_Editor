const { Schema, model } = require("mongoose");

//Definition of new document schema
const Document = new Schema({
  _id: String,
  data: Object,
});
//used for exporting document modal
module.exports = model("Document", Document);
