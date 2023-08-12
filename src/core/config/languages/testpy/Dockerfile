# This folder is the source for the image `fusionsid/testpy`
# In the future I will just use that as it is prebuilt on docker hub

FROM python:alpine

WORKDIR /tmp

RUN pip install pytest
RUN pip install pytest-timeout
RUN pip install pytest-json-report

COPY ./ ./

CMD ["/bin/sh", "run.sh"]
