
// ---------------------------以下引入模組-------------------------------


const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../db_connect2");
const moment = require("moment-timezone");
const multer = require("multer");
const upload = require(__dirname + "/../upload-img-module");
const fs = require("fs");


// ----------------------以下為重構之function----------------------------


// get data頁碼
async function getListData(req) {
  const output = {
    page: 0,
    perPage: 10,
    totalRows: 0,
    totalPages: 0,
    rows: [],
    pages: []
  };

  const [
    [{
      totalRows
    }]
  ] = await db.query("SELECT COUNT(1) totalRows FROM w_product_mainlist");
  if (totalRows > 0) {
    let page = parseInt(req.query.page) || 1;
    output.totalRows = totalRows;
    output.totalPages = Math.ceil(totalRows / output.perPage);

    if (page < 1) {
      output.page = 1;
    } else if (page > output.totalPages) {
      output.page = output.totalPages;
    } else {
      output.page = page;
    }

    (function (page, totalPages, prevNum) {
      let beginPage, endPage;
      if (totalPages <= prevNum * 2 + 1) {
        beginPage = 1;
        endPage = totalPages;
      } else if (page - 1 < prevNum) {
        beginPage = 1;
        endPage = prevNum * 2 + 1;
      } else if (totalPages - page < prevNum) {
        beginPage = totalPages - (prevNum * 2 + 1);
        endPage = totalPages;
      } else {
        beginPage = page - prevNum;
        endPage = page + prevNum;
      }
      output.beginPage = beginPage;
      output.endPage = endPage;
    })(page, output.totalPages, 3);

    let sql = `SELECT * FROM w_product_mainlist LIMIT ${(output.page-1)*output.perPage}, ${output.perPage}`;

    const [results] = await db.query(sql);
    results.forEach(el => {
      el.last_edit_time = moment(el.last_edit_time).format("YYYY-MM-DD");
      el.on_shelf_time = moment(el.on_shelf_time).format("YYYY-MM-DD");
      el.off_shelf_time = moment(el.off_shelf_time).format("YYYY-MM-DD");
    });
    output.rows = results;
  }

  return output;
};

async function getEditList(req) {
  const output = {
    cates: [],
    colors: [],
    row: [],
    chair_body: [],
    chair_seat: [],
    designer: []
  };

  const sql_cates = `SELECT * FROM w_product_categories`;
  const sql_color = `SELECT * FROM w_chair_color`;
  const sql_chair_body = `SELECT * FROM w_chair_body`;
  const sql_chair_seat = `SELECT * FROM w_chair_seat`;
  const sql_chair_designer = `SELECT * FROM w_chair_designer`;
  const sql = "SELECT * FROM w_product_mainlist WHERE sid=?";

  [output.cates] = await db.query(sql_cates);
  [output.colors] = await db.query(sql_color);
  [output.chair_body] = await db.query(sql_chair_body);
  [output.chair_seat] = await db.query(sql_chair_seat);
  [output.designer] = await db.query(sql_chair_designer);

  const [results] = await db.query(sql, [req.params.sid]);
  output.row = results[0];
  // length>0 則為true
  if (!results.length) {
    // return用意是讓function結束，下面不執行
    return res.redirect("/man_product/list");
  }

  results[0].last_edit_time = moment(results[0].last_edit_time).format(
    "YYYY-MM-DD"
  );
  results[0].on_shelf_time = moment(results[0].on_shelf_time).format(
    "YYYY-MM-DD"
  );
  results[0].off_shelf_time = moment(results[0].off_shelf_time).format(
    "YYYY-MM-DD"
  );
  return output;
}




// -----------------畫面3個：列表頁面、編輯頁面、新增頁面--------------------


// 列表頁面
router.get("/list", async (req, res) => {
  const output = await getListData(req);
  res.render("man_product/man_product_list", output);
});


// 編輯頁面
router.get("/edit/:sid", async (req, res) => {
  const output = await getEditList(req);
  res.render("man_product/man_product_edit", output);
});



// 新增頁面
router.get("/add", async (req, res) => {


  const output = {
    cates: [],
    colors: [],
    chair_body: [],
    chair_seat: [],
    designer: []
  };

  const sql_cates = `SELECT * FROM w_product_categories`;
  const sql_color = `SELECT * FROM w_chair_color`;
  const sql_chair_body = `SELECT * FROM w_chair_body`;
  const sql_chair_seat = `SELECT * FROM w_chair_seat`;
  const sql_chair_designer = `SELECT * FROM w_chair_designer`;

  [output.cates] = await db.query(sql_cates);
  [output.colors] = await db.query(sql_color);
  [output.chair_body] = await db.query(sql_chair_body);
  [output.chair_seat] = await db.query(sql_chair_seat);
  [output.designer] = await db.query(sql_chair_designer);

 
  res.render("man_product/man_product_add", output);
});




// ------------------------- 以下為 RESTful API------------------------------


// 編輯表單 API
router.post('/edit/:sid', upload.none(), async (req, res) => {
  const data = {
    ...req.body
  };

  const sql = "UPDATE `e_fund_project` SET ? WHERE `sid`=?";
  const [{
    affectedRows,
    changedRows
  }] = await db.query(sql, [data, req.params.sid]);

  //  {"fieldCount":0,"affectedRows":1,"insertId":0,"info":"Rows matched: 1  Changed: 0  Warnings: 0","serverStatus":2,"warningStatus":0,"changedRows":0}

  res.json({
    success: !!changedRows,
    affectedRows,
    changedRows,
  });
});


// 單張圖片上傳 API
router.post("/try-upload", upload.single('myfile'), (req, res) => {
  console.log('req.file' + req.file);

  if (req.file && req.file.originalname) {
    let ext = "";

    switch (req.file.mimetype) {
      case "image/png":
      case "image/jpeg":
      case "image/gif":
        fs.rename(
          req.file.path,
          __dirname + "/../public/img/" + req.file.originalname,
          (error) => {
            return res.json({
              success: true,
              path: "/img/" + req.file.originalname,
              newFileName: req.file.filename
            });
          }
        );

        break;
      default:
        fs.unlink(req.file.path, (error) => {
          return res.json({
            success: false,
            msg: "不是圖檔",
          });
        });
    }
  } else {
    return res.json({
      success: false,
      msg: "沒有上傳檔案",
    });
  }
});


// 新增表單 API
router.post('/add', upload.none(), async (req, res) => {
  const data = {
    ...req.body
  };
  // data.last_edit_time = moment(new Date()).format(
  //   "YYYY-MM-DD");



  const sql = "INSERT INTO `e_fund_project` set ?";
  const [{
    affectedRows,
    insertId
  }] = await db.query(sql, [data]);
  // sql是語法一個問號即可，data是array
  // [{"fieldCount":0,"affectedRows":1,"insertId":860,"info":"","serverStatus":2,"warningStatus":1},null]

  res.json({
    success: !!affectedRows,
    affectedRows,
    insertId,
  });
});


// 資料刪除 API
router.delete("/del/:sid", async (req, res) => {
  const sql = "DELETE FROM `e_fund_project` WHERE sid=?";
  const [results] = await db.query(sql, [req.params.sid]);
  res.json(results);
});


// -------------------------------- 以下匯出模組------------------------------


// 記得加這句呀～module匯出index才能用呀～
module.exports = router;