const connection = require("../../connection");
const excel = require("exceljs");
const util = require("../../util");


async function getOfferList(req) {
    let page = req.body.params.page;
    let per_page = req.body.params.per_page;
    let start = per_page * (page - 1);
    let business_id = req.body.params.business_id;
    let death_id = req.body.params.death_id;
    let sqlStr = "SELECT t_offer.*, t_death.code as death_code, t_business.code as business_code, t_viewer.uuid as viewer_uuid " +
        " from t_offer " +
        " left join t_death on t_offer.death_id = t_death.id " +
        " left join t_business on t_death.business_id = t_business.id " +
        " left join t_viewer on t_offer.member_id = t_viewer.id " +
        " where t_death.company_id IS NOT NULL ";
    if(business_id && business_id > 0) {
        sqlStr = sqlStr + " AND t_death.business_id = " + business_id;
    }
    if(death_id && death_id > 0) {
        sqlStr = sqlStr + " AND t_death.id = " + death_id;
    }
    let date = req.body.params.date;
    if(date) {
        date = date + '-01';
        date = new Date(date);
        let start_time = convertDate(date);
        var end_time = convertDate(new Date(date.setMonth(date.getMonth() + 1)));
        sqlStr = sqlStr + " and t_offer.create_time >= '" + start_time + "' " +
            " and t_offer.create_time < '" + end_time + "' ";
    }
    sqlStr = sqlStr + " ORDER BY t_offer.id LIMIT " + start + ", " + per_page;
    console.log(sqlStr);
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function removeOffer(req) {
    let checkSqlStr = "DELETE FROM t_offer WHERE id = " + req.body.id;
    let db = connection.makeDb();
    await db.query(checkSqlStr);
}

async function getOfferDetail(req) {
    let id = req.body.id;
    let sqlStr = "SELECT * FROM t_offer WHERE id = " + id + " AND status = 2";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    let offer = result[0];
    console.log(offer);
    let death_id = offer.death_id;
    sqlStr = "SELECT t_death.*, t_manager.name as manager_name, t_manager.relation, t_manager.bank_info, t_place.name as place_name, " +
        " t_business.name as business_name, t_business.code as business_code, t_business.fax as business_fax, t_business.state, t_business.city, t_business.street, t_business.build_name, t_business.mobile as business_mobile, t_business.email as business_email, t_business.unit, " +
        " t_company.name as company_name, t_company.address as company_address, t_company.zip as company_zip, t_company.mobile as company_mobile, t_company.email as company_email " +
        " from t_death " +
        " left join t_manager on t_death.id = t_manager.death_id " +
        " left join t_place on t_place.id = t_death.place_id " +
        " left join t_business on t_business.id = t_death.business_id " +
        " left join t_company on t_company.id = t_death.company_id " +
        "WHERE t_death.id = '" + death_id + "' ";
    result = await db.query(sqlStr);
    let death = result[0];
    sqlStr = "SELECT *, t_schedule.id as schedule_id " +
        " from t_schedule " +
        " left join t_place on t_schedule.place_id = t_place.id " +
        " where death_id = '" + death_id + "'";
    let scheduleList = await db.query(sqlStr);
    death.schedules = scheduleList;
    return {
        offer: offer,
        death: death,
    }
}

async function getAllOfferList(req) {
    let business_id = req.body.params.business_id;
    let death_id = req.body.params.death_id;
    let sqlStr = "SELECT t_offer.*, t_death.code as death_code, t_business.code as business_code, t_viewer.uuid  as viewer_uuid " +
        " from t_offer " +
        " left join t_death on t_offer.death_id = t_death.id " +
        " left join t_business on t_death.business_id = t_business.id " +
        " left join t_viewer on t_offer.member_id = t_viewer.id " +
        " where t_death.company_id IS NOT NULL ";
    if(business_id && business_id > 0) {
        sqlStr = sqlStr + " AND t_death.business_id = " + business_id;
    }
    if(death_id && death_id > 0) {
        sqlStr = sqlStr + " AND t_death.id = " + death_id;
    }
    let date = req.body.params.date;
    if(date) {
        date = date + '-01';
        date = new Date(date);
        let start_time = convertDate(date);
        var end_time = convertDate(new Date(date.setMonth(date.getMonth() + 1)));
        sqlStr = sqlStr + " and t_offer.create_time >= '" + start_time + "' " +
            " and t_offer.create_time < '" + end_time + "' ";
    }
    sqlStr = sqlStr + " ORDER BY t_offer.id";
    let db = connection.makeDb();
    let result = await db.query(sqlStr);
    return result;
}

async function getTotalOffer(req) {
    let business_id = req.body.params.business_id;
    let death_id = req.body.params.death_id;
    let sqlStr = "SELECT COUNT(t_offer.id) as cnt " +
        " from t_offer " +
        " left join t_death on t_offer.death_id = t_death.id " +
        " where t_death.company_id IS NOT NULL ";
    if(business_id && business_id > 0) {
        sqlStr = sqlStr + " AND t_death.business_id = " + business_id;
    }
    if(death_id && death_id > 0) {
        sqlStr = sqlStr + " AND t_death.id = " + death_id;
    }
    let date = req.body.params.date;
    if(date) {
        date = date + '-01';
        date = new Date(date);
        let start_time = convertDate(date);
        var end_time = convertDate(new Date(date.setMonth(date.getMonth() + 1)));
        sqlStr = sqlStr + " and t_offer.create_time >= '" + start_time + "' " +
            " and t_offer.create_time < '" + end_time + "' ";
    }
    console.log(sqlStr);
    let db = connection.makeDb();
    let result = await db.query(sqlStr);

    return result[0].cnt;
}

function convertDate(dateStr) {
    let date = new Date(dateStr);
    let converted = date.getFullYear() + "-" + util.getTwoDigit(date.getMonth() + 1) + "-" + util.getTwoDigit(date.getDate()) + " " + util.getTwoDigit(date.getHours()) + ":" + util.getTwoDigit(date.getMinutes());
    return converted;
}

module.exports = {

    getOfferListApi: async function (req, res) {
        try {
            let totalCount = await getTotalOffer(req);
            let offerList = await getOfferList(req);
            let totalPage = parseInt((totalCount - 1) / req.body.params.per_page + 1);
            let page = req.body.params.page;
            let per_page = req.body.params.per_page;
            let start = per_page * (page - 1);

            offerList.forEach((obj) => {
                obj.date = convertDate(obj.create_time);
            });

            res.send(JSON.stringify({
                status: true,
                per_page: req.body.params.per_page,
                page: req.body.params.page,
                total: totalCount,
                last_page: totalPage,
                from: start,
                to: start + per_page,
                data: offerList,
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },

    downloadOfferListApi: async function (req, res) {
        try {
            let offerList = await getAllOfferList(req);

            let columns = [
                { header: "発注日時", key: "date", width: 5 },
                { header: "発注ID", key: "code", width: 25 },
                { header: "訃報ID", key: "death_code", width: 10 },
                { header: "発注社ID", key: "business_code", width: 10 },
                { header: "弔問者ID", key: "viewer_uuid", width: 25 },
            ];


            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("発注");

            worksheet.columns = columns;

            let tutorials = [];
            offerList.forEach((obj) => {
                tutorials.push({
                    date: convertDate(obj.create_time),
                    code: obj.code,
                    death_code: obj.death_code,
                    viewer_uuid: obj.viewer_uuid,
                    business_code: obj.business_code,
                });
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
    removeOfferApi: async function (req, res) {
        try {
            await removeOffer(req);
            res.send(JSON.stringify({
                status: true
            }));
        } catch(ex) {
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
    getOfferDetailApi: async function (req, res) {
        try {
            let result = await getOfferDetail(req);
            res.send(JSON.stringify({
                status: true,
                detail: result
            }));
        } catch(ex) {
            console.log(ex);
            res.send(JSON.stringify({
                status: false,
            }));
        }
    },
};
