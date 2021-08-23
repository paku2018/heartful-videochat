const connection = require("../../connection");
const excel = require("exceljs");



async function getPaymentList(req) {
    let page = req.body.params.page;
    let per_page = req.body.params.per_page;
    let start = per_page * (page - 1);
    let start_time = req.body.params.start_time;
    let end_time = req.body.params.end_time;
    let sqlStr = "SELECT t_payment_log.*, t_product.name as product_name, t_business.name as business_name, t_viewer.uuid as viewer_uuid, t_business.code as business_code, t_death.code as death_code " +
        " from t_payment_log " +
        " left join t_product on t_payment_log.product_id = t_product.id " +
        " left join t_business on t_product.business_id = t_business.id " +
        " left join t_viewer on t_payment_log.viewer_id = t_viewer.id " +
        " left join t_death on t_viewer.death_id = t_death.id " +
        " where t_payment_log.create_time > '" + start_time + "' " +
        " and t_payment_log.create_time < '" + end_time + "' " +
        "ORDER BY id LIMIT " + start + ", " + per_page;
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getAllPaymentList(req) {
    let start_time = req.body.params.start_time;
    let end_time = req.body.params.end_time;
    let sqlStr = "SELECT t_payment_log.*, t_product.name as product_name, t_business.name as business_name, t_viewer.uuid as viewer_uuid, t_business.code as business_code, t_death.code as death_code " +
        " from t_payment_log " +
        " left join t_product on t_payment_log.product_id = t_product.id " +
        " left join t_business on t_product.business_id = t_business.id " +
        " left join t_viewer on t_payment_log.viewer_id = t_viewer.id " +
        " left join t_death on t_viewer.death_id = t_death.id " +
        " where t_payment_log.create_time > '" + start_time + "' " +
        " and t_payment_log.create_time < '" + end_time + "' " +
        "ORDER BY id ";
    console.log(sqlStr);
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getTotalPayment(req) {
    let start_time = req.body.params.start_time;
    let end_time = req.body.params.end_time;
    let checkSqlStr = "SELECT COUNT(id) as cnt FROM t_payment_log WHERE create_time > '" + start_time + "' " +
        " AND create_time < '" + end_time + "' ";
    let db = connection.makeDb();
    let result = await db.query(checkSqlStr);
    return result[0].cnt;
}



function convertValue(value) {
    return "¥" + parseInt(value).toLocaleString();
}

function convertDate(dateStr) {
    let date = new Date(dateStr);
    let converted = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
    return converted;
}

module.exports = {

    getPaymentListApi: async function (req, res) {
        try {
            let totalCount = await getTotalPayment(req);
            let paymentList = await getPaymentList(req);
            let totalPage = parseInt((totalCount - 1) / req.body.params.per_page + 1);
            let page = req.body.params.page;
            let per_page = req.body.params.per_page;
            let start = per_page * (page - 1);

            paymentList.forEach((obj) => {
                obj.date = convertDate(obj.create_time);
            });

            let allPaymentList = await getAllPaymentList(req);
            let sum_total_cost = 0;
            let sum_cost = 0;
            allPaymentList.forEach((obj) => {
                sum_total_cost = sum_total_cost + parseInt(obj.total_cost);
                sum_cost = sum_cost + parseInt(obj.cost);
            });

            res.send(JSON.stringify({
                status: true,
                per_page: req.body.params.per_page,
                page: req.body.params.page,
                total: totalCount,
                last_page: totalPage,
                from: start,
                to: start + per_page,
                data: paymentList,
                total_cost: sum_total_cost,
                cost: sum_cost
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },

    downloadPaymentListApi: async function (req, res) {
        try {
            let paymentList = await getAllPaymentList(req);
            let downloadFields = req.body.params.fields.split(',');
            let originalColumns = [
                { header: "売上日時", key: "date", width: 5 },
                { header: "訃報ID", key: "death_code", width: 25 },
                { header: "弔問者ID", key: "viewer_uuid", width: 25 },
                { header: "発注社ID", key: "business_code", width: 10 },
                { header: "発注先", key: "business_name", width: 10 },
                { header: "商品名", key: "product_name", width: 10 },
                { header: "販売表示価格(税抜)", key: "total_cost", width: 10 },
                { header: "提携先手数料", key: "fee", width: 10 },
                { header: "葬儀社売上", key: "cost", width: 10 },
            ];
            let columns = [];
            downloadFields.forEach(field => {
                originalColumns.forEach(obj => {
                    if(obj.key == field) {
                        columns.push(obj);
                    }
                })
            });

            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("売上");

            worksheet.columns = columns;

            let tutorials = [];
            let sum_total_cost = 0;
            let sum_cost = 0;
            paymentList.forEach((obj) => {
                tutorials.push({
                    date: convertDate(obj.create_time),
                    death_code: obj.death_code,
                    viewer_uuid: obj.viewer_uuid,
                    business_code: obj.business_code,
                    business_name: obj.business_name,
                    product_name: obj.product_name,
                    total_cost: convertValue(obj.total_cost),
                    fee: convertValue(obj.total_cost - obj.cost),
                    cost: convertValue(obj.cost)
                });
                sum_total_cost = sum_total_cost + parseInt(obj.total_cost);
                sum_cost = sum_cost + parseInt(obj.cost);
            });
            tutorials.push({
                date: '合計',
                death_code: '',
                viewer_uuid: '',
                business_code: '',
                business_name: '',
                product_name: '',
                total_cost: convertValue(sum_total_cost),
                fee: convertValue(sum_total_cost - sum_cost),
                cost: convertValue(sum_cost)
            });
            worksheet.addRows(tutorials);

            // res is a Stream object
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "tutorials.xlsx"
            );
            await workbook.xlsx.write(res);
            res.status(200).end();
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
};
