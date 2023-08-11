FROM python:alpine

WORKDIR /tmp

RUN pip install pytest
RUN pip install pytest-timeout
RUN pip install pytest-json-report

COPY ./ ./

CMD ["/bin/sh", "run.sh"]
