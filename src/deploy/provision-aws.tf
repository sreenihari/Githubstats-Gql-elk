provider "aws" {
  region     = "us-east-1"
  max_retries = 1
}

variable "tag_name" {
  default = "devops-logging-test"
}


#vpc
resource "aws_vpc" "test" {
  cidr_block = "10.1.0.0/16"
  tags = {
   Name = var.tag_name 
  }
}

# Subnet
resource "aws_subnet" "webserver" {
  vpc_id     = aws_vpc.test.id
  cidr_block = "10.1.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "${var.tag_name}-webserver"
  }
}

resource "aws_route_table" "default" {
  vpc_id = aws_vpc.test.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = var.tag_name
  }
}


resource "aws_route_table_association" "default" {
  subnet_id      = aws_subnet.webserver.id
  route_table_id = aws_route_table.default.id
}

# Network ACL: we just allow everything
resource "aws_network_acl" "webserver" {
  vpc_id = aws_vpc.test.id

  egress {
    protocol   = "-1"
    rule_no    = 200
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  ingress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = var.tag_name
  }
}

# Internet Gateway so that we can talk over the public
# Internet.
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.test.id

  tags = {
    Name = var.tag_name
  }
}

# Security Group: 80 and 22 only, plus all egress.
resource "aws_security_group" "protected" {
  name        = "protected"
  description = "Only allows HTTP and SSH"
  vpc_id      = aws_vpc.test.id

  ingress {
    # TLS (change to whatever ports you need)
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    # TLS (change to whatever ports you need)
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    cidr_blocks     = ["0.0.0.0/0"]
  }
}

# An EIP isn't strictly required, but I like
# ensure the IP is static and in my control as
# and when I can.
resource "aws_eip" "webserver" {
  instance = aws_instance.webserver.id
  vpc      = true
  depends_on = ["aws_internet_gateway.igw"]
}

resource "aws_key_pair" "webserver" {
  key_name   = "webserver-keypair"
  public_key = ""
}

data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

resource "aws_instance" "webserver" {
  ami                     = data.aws_ami.ubuntu.id
  availability_zone       = "us-east-1a"
  instance_type           = "t2.large"
  key_name                = aws_key_pair.webserver.key_name
  vpc_security_group_ids  = [aws_security_group.protected.id]
  subnet_id               = aws_subnet.webserver.id

  root_block_device {
    volume_size = 50
  }

  tags = {
    Name = "${var.tag_name}-webserver-01"
  }
}

output "instance_ip_addr" {
  value = aws_eip.webserver.public_ip
}










