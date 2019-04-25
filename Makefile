.PHONY: clean server 

all: server

server:
	$(MAKE) -C server all

test:
	$(MAKE) -C server test

clean:
	rm -r build/**
