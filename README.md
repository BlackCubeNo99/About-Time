# About-Time

🕸️ Node.js + EJS 实现定时爬虫脚本

爬虫中使用到的 NPM 包：

-   superagent
-   cheerio
-   nodemailer
-   ejs
-   fs
-   path
-   pm2

相关介绍可以点击 [Node 爬虫常用工具](https://github.com/BlackCubeNo99/Blog/issues/15) 查看。

## 安装

```bash
$ npm install
```

## 使用

编辑 `index.js` 文件，配置 STMP 邮件服务的 `HOST` 、发送人 `FROM_EMAIL`、收件人 `TO_EMAIL`、授权码 `PASS`

```bash
$ node index.js
```
