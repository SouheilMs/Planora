FROM osixia/openldap:latest

# Copy your init file into the image during the build phase
# This way, it's already "inside" and doesn't need a volume mount
COPY ./init.ldif /container/service/slapd/assets/config/bootstrap/ldif/custom/init.ldif