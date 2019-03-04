const superagent = require('superagent')
const cheerio = require('cheerio')
const nodemailer = require('nodemailer')
const ejs = require('ejs')
const fs = require('fs')
const path = require('path')

const START_DAY = '2018/08/08'
const LOCAL = 'guangdong/shenzhen' // 所在城市

const ONE_URL = 'http://wufazhuce.com/'
const WEATHER_URL = 'https://tianqi.moji.com/weather/china/' + LOCAL

const HOST = 'smtp.qq.com' // 这里使用了 QQ 邮件的 SMTP 服务，根据实际情况修改

const FROM_EMAIL = 'xxxxxxxxxx@qq.com' // 发件人邮箱
const TO_EMAIL = 'xxxxxxxxxx@qq.com' // 收件人邮箱
const PASS = 'xxxxxxxxxx' // 授权码

let htmlData = {}

// 抓取轮播的第一个 ONE 数据
function getOneData() {
    return new Promise((resolve, reject) => {
        superagent.get(ONE_URL).end((err, res) => {
            if (err) {
                reject(err)
            }
            let $ = cheerio.load(res.text)
            let items = $('#carousel-one .carousel-inner .item')
            let first = items[0]
            let carouselData = {
                cover: $(first) // 封面图
                    .find('.fp-one-imagen')
                    .attr('src'),
                type: $(first) // 图片类型
                    .find('.fp-one-imagen-footer')
                    .text()
                    .trim(),
                text: $(first) // 文案
                    .find('.fp-one-cita')
                    .text()
                    .trim()
            }
            resolve(carouselData)
        })
    })
}

// 抓取墨迹天气数据
function getWeatherData() {
    return new Promise((resolve, reject) => {
        superagent.get(WEATHER_URL).end((err, res) => {
            if (err) {
                reject(err)
            }
            let weatherData = []
            const $ = cheerio.load(res.text)
            const weatherTips = $('.wea_tips em').text()

            htmlData['weatherTips'] = weatherTips

            $('.forecast .days').each((i, elem) => {
                const day = $(elem).find('li')

                weatherData.push({
                    day: $(day[0])
                        .text()
                        .trim(),
                    weather: $(day[1])
                        .text()
                        .trim(),
                    weatherIcon: $(day[1])
                        .find('img')
                        .attr('src'),
                    temperature: $(day[2])
                        .text()
                        .trim(),
                    direction: $(day[3])
                        .find('em')
                        .text()
                        .trim(),
                    level: $(day[3])
                        .find('b')
                        .text()
                        .trim(),
                    air: $(day[4])
                        .text()
                        .trim()
                })
            })

            resolve(weatherData)
        })
    })
}

// 发送邮件
function sendMail(htmlData) {
    let transporter = nodemailer.createTransport({
        host: HOST, // QQ 的 STMP 服务地址
        secureConnection: true, // 使用 SSL 协议
        port: 465,
        secure: true, // true 开启 465 端口，false 开启 587 端口
        auth: {
            user: FROM_EMAIL, // 你的邮箱账号
            pass: PASS // 授权码在设置 -> 账号 -> 开启 POP3/SMTP 服务后获取
        }
    })

    // EJS 模版编译
    const template = ejs.compile(
        fs.readFileSync(path.resolve(__dirname, 'email.ejs'), 'utf-8')
    )
    const html = template(htmlData)

    // 设置邮件内容
    let mailOptions = {
        from: FROM_EMAIL, // 发件人
        to: TO_EMAIL, // 收件人
        subject: '每日邮件', // 主题
        // text: '邮件内容可以采用纯文字的方式', // 纯文字
        html: html // html 字段不能和 text 字段同时存在
        /* attachments: [ // 发送附件
            {
                filename: 'example.md', // 文件名
                path: './example.md' // 文件路径
            }
        ] */
    }

    // 使用 SendMail 方法发送邮件
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err)
        }
        console.log(`Message: ${info.messageId}`)
        console.log(`sent: ${info.response}`)
    })
}

function getAllDataAndSendMail() {
    let today = new Date()
    let initDate = new Date(START_DAY)
    let lastDay = Math.floor((today - initDate) / 1000 / 60 / 60 / 24)
    let todayData = `${today.getFullYear()}/${today.getMonth() +
        1}/${today.getDate()}`

    htmlData['lastDay'] = lastDay
    htmlData['todayData'] = todayData

    Promise.all([getOneData(), getWeatherData()]).then(data => {
        htmlData['oneData'] = data[0]
        htmlData['weatherData'] = data[1]
        sendMail(htmlData)
    })
}

getAllDataAndSendMail()
