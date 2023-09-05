const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

app.use(express.json());

let DB = null;

const initializationServerAndDataBase = async () => {
  try {
    DB = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at http://localhost:3001/");
    });
  } catch (err) {
    console.log(`DB Error: ${err}`);
    process.exit(1);
  }
};

initializationServerAndDataBase();

const convertStatesObjectToResponseObject = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

const convertDistrictObjectToResponseObject = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};

//API - 1

app.get("/states/", async (request, response) => {
  const stateDetailsQuery = `
    SELECT 
        *
    FROM
        state;`;

  const stateArray = await DB.all(stateDetailsQuery);
  response.send(
    stateArray.map((stateObject) =>
      convertStatesObjectToResponseObject(stateObject)
    )
  );
});

//API - 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateIdQuery = `
    SELECT 
    *
    FROM
        state
    WHERE
        state_id = ${stateId};`;

  const stateDetails = await DB.get(stateIdQuery);
  response.send(convertStatesObjectToResponseObject(stateDetails));
});

//API - 3

app.post("/districts/", async (request, response) => {
  const creatDistrict = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = creatDistrict;

  const newDistrictQuery = `
  INSERT INTO
    district (district_name,state_id,cases,cured,active,deaths)
  VALUES
    ('${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths});`;
  const addDistrict = await DB.run(newDistrictQuery);
  response.send("District Successfully Added");
});

//API - 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtIdQuery = `
    SELECT 
    *
    FROM
        district
    WHERE
        district_id = ${districtId};`;

  const districtDetails = await DB.get(districtIdQuery);
  response.send(convertDistrictObjectToResponseObject(districtDetails));
});

//API - 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtIdQuery = `
    DELETE

    FROM
        district
    WHERE
        district_id = ${districtId};`;

  const districtDetails = await DB.run(districtIdQuery);
  response.send("District Removed");
});

//API - 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistrictQuery = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};`;

  const addDistrict = await DB.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API - 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDistrictQuery = `
    SELECT 
        SUM(cases) as totalCases,
        SUM(cured) as totalCured,
        SUM(active) as totalActive,
        SUM(deaths) as totalDeaths
    FROM
        district
    WHERE
        state_id = ${stateId};`;

  const districtDetails = await DB.get(getDistrictQuery);
  response.send(districtDetails);
});

//API - 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
        state_name AS stateName
    FROM
        district 
        INNER JOIN state On district.state_id=state.state_id
    WHERE
        district_id = ${districtId};`;

  const stateName = await DB.get(getDistrictQuery);
  response.send(stateName);
});

module.exports = app;
