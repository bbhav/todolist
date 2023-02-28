//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require ("mongoose");
const _ = require ("lodash");

const app = express();
const PORT = process.env.PORT || 3000;

//mongoose.set('strictQuery,false');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const connectDB = async ()=> {
  try {
    const conn = mongoose.connect (process.env.MONGO_URI);
    console.log('MongoDB Connected: ${conn.connection.host}')
  } catch (error){
    console.log(error);
    process.exit(1);
  }
}

const itemsSchema = new mongoose.Schema({
name:String
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item ({
  name:"Yoga"
});

const item2  = new Item ({
  name:"Stretch"
});

const item3  = new Item ({
  name: "Run"
});

const defaultItems= [item1,item2,item3];

const listSchema ={
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema)

// 
app.get("/", function(req, res) {
  Item.find({},function (err,foundItems){   
  if (foundItems.length ==0){
    Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        } else {
          console.log ("Successful");
        }
      });
      res.redirect("/");
  } else {
  res.render("list", {listTitle: "Today", newListItems:foundItems});
  }});
});
  

app.get("/:customListName",function(req,res){
const customListName = _.capitalize(req.params.customListName);

List.findOne({name:customListName},function(err, foundList){
  if(!err){
    if(!foundList){
      const list = new List ({
        name:customListName,
        items:defaultItems
      })
      list.save();
      res.redirect("/"+ customListName);
    }else{
    res.render("list", {listTitle: foundList.name, newListItems:foundList.items})
    }
  }
  });
});


app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item =new Item ({
    name: itemName
  });
if (listName === "Today"){
  item.save();
  res.redirect("/");
} else {
  List.findOne({name: listName},function(err,foundList){
    foundList.items.push(item);
    foundList.save();
    res.redirect("/"+listName);
  });
}
});

app.post("/delete",function(req,res){
  const checkedItemId =  req.body.checkbox;
  const listName =req.body.listName;
  if (listName === "Today"){Item.findByIdAndRemove(checkedItemId,function(err){
    if(!err){
      console.log("Successfully deleted checked item");
      res.redirect("/");
    }
  });
}else {
  List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err, foundList){
    if (!err){
      res.redirect("/"+ listName);
    }
  });
}
  
});




app.get("/about", function(req, res){
  res.render("about");
});

connectDB().then(()=>{
app.listen(PORT, function() {
  console.log("Server started on port ${PORT}");
})
});

// if (req.body.list === "Work") {
//   workItems.push(item);
//   res.redirect("/work");
// } else {
//   items.push(item);
//   res.redirect("/");
// }


// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });
