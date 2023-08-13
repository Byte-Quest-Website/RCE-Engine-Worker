FROM python:alpine

WORKDIR /

RUN apk add build-base linux-headers
RUN pip install pytest
RUN pip install pytest-timeout
RUN pip install pytest-json-report
RUN pip install pytest-monitor
RUN pip install humanize

COPY ./ ./

WORKDIR /tmp

CMD ["/bin/sh", "/run.sh"]
