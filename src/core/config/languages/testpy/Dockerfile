FROM python:alpine

WORKDIR /

RUN pip install pytest
RUN pip install pytest-timeout
RUN pip install pytest-json-report

COPY ./ ./

WORKDIR /tmp

CMD ["/bin/sh", "/run.sh"]
