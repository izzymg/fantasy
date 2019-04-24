.PHONY: clean server 

all: server

server:
	cd server
	npm i --depth=0

clean:
	rm -r build/**
