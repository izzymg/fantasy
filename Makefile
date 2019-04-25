.PHONY: clean server 

all: server

server:
	$(MAKE) -C server all

clean:
	rm -r build/**
