const { Client } = require("@notionhq/client");
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const env = require('dotenv').config();
const PORT = 3000;
const NOTION_API_KEY = env.parsed.NOTION_API_KEY;
const DATABASE_ID = env.parsed.DATABASE_ID;

app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

// Initializing a client
const main = async () => {
    const notion = new Client({
        auth: NOTION_API_KEY,
    });

    const database_id = DATABASE_ID;

    const database_children = await notion.databases.query({database_id: database_id,});

    const page_list = [];

    for (const page of database_children.results) {
        var page_data = {page_title:page.properties['タイトル'].title[0].plain_text,page_id:page.id}
        page_list.push(page_data);
    }

    console.log(page_list);

    async function getContents(block_id,page_title) {
        var children_page = await notion.blocks.children.list({block_id: block_id,});
        console.log(children_page);

        var create_by = children_page.results[0].created_time;
        create_by = create_by.split("T")[0];
        create_by = create_by.replaceAll("-","/");
        const data = {title:page_title,create_by:create_by,image:[],texts:[]};
        for (const block of children_page.results) {
            if (block.type === 'paragraph' && block.paragraph.rich_text.length > 0) {
                data.texts.push(block.paragraph.rich_text[0].text.content);
            }
            if (block.type === 'image') {
                data.image.push(block.image.file.url);
            }
        }
        console.log(data);
        return data;
    }

    app.get("/",(req,res) => {
        res.render("./index.ejs",{page_list:page_list});
    });

    app.post("/page", async (req,res) => {
        try{
            const data = await getContents(req.body.page_id,req.body.page_title);
            res.render("./page.ejs",{data:data});
        }catch(error) {
            res.status(500).json({ error: error.message });
        }
        
    });
    
    app.listen(PORT);
}

main();