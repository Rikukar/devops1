FROM golang:1.21-alpine AS build
WORKDIR /src
COPY main.go .
RUN go build -o /storageapp main.go

FROM alpine:3.18
COPY --from=build /storageapp /storageapp
RUN mkdir -p /data
VOLUME ["/data"]
EXPOSE 8200
CMD ["/storageapp"]