sudo timeout -s SIGKILL 50 \
    docker run -a stdin -a stdout -a stderr \
    -i --read-only --network=none --memory=25mb \
    --tmpfs /tmp:exec \
    -v "$1:ro" \
    -v "$2:ro" \
    --name=$3 \
    "$4" < "$5"