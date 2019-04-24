.PHONY: clean server 

all: server

server:
	npm i --depth=0 

clean:
	rm -r build/**