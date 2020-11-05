// --------------------------- 以下引入模組 -------------------------------

const express = require('express')
const router = express.Router()

// const db = require(__dirname + '/../../db_connect2')

// const moment = require('moment-timezone')
// const multer = require('multer')
// const upload = require(__dirname + '/../../react-upload-img-module')

const controller = require('./controller')

//登入
router.post('/login', controller.login)

// 登出
router.post('/logout', (req, res) => {
  console.log('    logout   ')
  const token = req.cookies['chademy-token']

  // 歸零
  res.cookie('chademy-token', token, {
    maxAge: 0,
    httpOnly: true,
  })

  // 刪除
  delete req.cookies['chademy-token']

  return res.json({
    success: true,
    msg: '登出成功',
    data: null,
  })
})

// 註冊
router.post('/register', controller.register)

//忘記密碼
router.post('/forgetPwd', controller.forgetPwd)
router.post('/resetPWD', controller.resetPWD)

// 帳號驗證
router.get('/userAuth', controller.userAuth)

// 測試 用
router.post('/loginTest', controller.loginTest)
router.get('/getTest', controller.getTest)

module.exports = router