run:

	@docker compose up -d --build
	
down:

	@docker compose down

network/create:

	@docker network inspect cronjob_network > /dev/null || docker network create --ipam-driver default --subnet=172.16.0.0/16 --attachable cronjob_network