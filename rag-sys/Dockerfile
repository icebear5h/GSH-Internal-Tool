FROM python:3.12


WORKDIR /code


COPY ./requirements.txt /code/requirements.txt

RUN pip install "fastapi[standard]"


RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt



COPY ./prisma /code/prisma


RUN prisma generate

COPY ./app /code/app



CMD ["fastapi", "run", "app/main.py", "--port", "80"]