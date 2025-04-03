build:
	docker build -t gakumas-tools .

start:
	docker run -p 80:3000 gakumas-tools
