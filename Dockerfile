FROM python:3.7-slim

COPY requirements.txt .

ENV VIRTUAL_ENV=/root/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

RUN pip3 install -r requirements.txt
