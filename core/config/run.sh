sudo timeout -s SIGKILL 5 \
    docker run -a stdin -a stdout -a stderr \
    -i --read-only --network=none --memory=25mb \
    -v "$1" \
    -v "$2" \
    --name=$3 \
    "$4" < "$5"