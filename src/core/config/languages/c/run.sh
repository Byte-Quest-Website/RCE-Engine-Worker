export $(cat .env | xargs) > /dev/null
gcc main.c -o main
./main