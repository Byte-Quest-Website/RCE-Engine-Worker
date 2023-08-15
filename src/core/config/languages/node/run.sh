export $(cat .env | xargs) > /dev/null
node code.js