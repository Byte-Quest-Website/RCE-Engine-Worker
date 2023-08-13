sudo timeout -s SIGKILL $1 \
    docker run -a stdin -a stdout -a stderr \
    -i --read-only --network=none --memory=$2 \
    --tmpfs /tmp:exec \
    -v "$3:ro" \
    -v "$4:ro" \
    --name=$5 \
    "$6" < "$7"