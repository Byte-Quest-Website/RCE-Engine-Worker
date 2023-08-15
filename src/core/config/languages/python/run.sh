export $(cat .env | xargs) > /dev/null
python3 main.py