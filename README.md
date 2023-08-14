# RCE-Engine-Worker

This proejct containers two workers. These workers are RabbitMQ consumers and will run arbitrary code in a containerized environment and then save the result to the database or cache. It can also test code against provided test cases. All code will be executed in docker containers.

## Whats Included 

**You must have docker installed on your system.**

There are two workers included in this project the general worker and test worker.

The general worker is for anyone to use. You can provide any code to this worker and it will run it in a containerized enviroment and then return the result. This isn't related to the website that is being made. The container does have some requirements and will be killed if there is too much memory or too much time being spent on it.

The tester worker is meant for the website that I am creating. This worker takes in code and a problem data file. The worker then tests the provied code against the input set and makes sure it returns all the expected results. It will also notify which test case it failed and the reason (eg timeout, memory eror, wrong answer etc). 

**It is recommended that all requests to these workers come through the API.**

Both workers are toggleable by using enviroment variables. This is so that you can choose which workers to run or run both if you wish.

## Usage

To use this you must create a `.env` file with the following data. There is an example of the `.env` file in `.env.example`.

The `.env` file will look like this:
```bash
DATABASE_URL="" # Database URL (For Prisma)

# These following env vars are booleans
TEST_CODE=true
RUN_CODE=false

# The REDIS_URL is optional, so you can leave it out
# if not provided it will use localhost on port 6379
REDIS_URL="" # URL to the redis database
```

Make sure to install all node dependencies with `npm i`.  
Once complete start the application either in dev mode with `npm run dev`, or build it with `npm run build` and run with `node dist/src/index.js`.   
Also the worker may require you enter your password for running docker or creating tmp files. This prompt might not occur until you have recieved a request so I would suggest running with `sudo` or making a test request before deployment.