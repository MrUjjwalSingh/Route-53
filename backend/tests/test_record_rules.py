from app.validation.record_rules import validate_record_values, validate_ttl


def test_a_record_valid():
    assert validate_record_values("A", ["192.0.2.1"]) == []


def test_a_record_invalid():
    assert validate_record_values("A", ["999.1.1.1"]) != []


def test_aaaa_record_valid():
    assert validate_record_values("AAAA", ["2001:db8::1"]) == []


def test_cname_multiple_values_rejected():
    errors = validate_record_values("CNAME", ["a.com.", "b.com."])
    assert errors != []


def test_txt_requires_quotes():
    assert validate_record_values("TXT", ["unquoted"]) != []
    assert validate_record_values("TXT", ['"quoted"']) == []


def test_txt_255_char_limit():
    long_value = '"' + ("a" * 256) + '"'
    assert validate_record_values("TXT", [long_value]) != []


def test_mx_requires_priority_and_host():
    assert validate_record_values("MX", ["10 mail.example.com."]) == []
    assert validate_record_values("MX", ["mail.example.com."]) != []


def test_srv_requires_four_fields():
    assert validate_record_values("SRV", ["1 10 5269 target.example.com."]) == []
    assert validate_record_values("SRV", ["1 10 target.example.com."]) != []


def test_caa_format():
    assert validate_record_values("CAA", ['0 issue "ca.example.net"']) == []
    assert validate_record_values("CAA", ['0 badtag "x"']) != []


def test_ttl_required_when_not_alias():
    assert validate_ttl(None, alias=False) != []
    assert validate_ttl(300, alias=False) == []


def test_ttl_must_be_null_for_alias():
    assert validate_ttl(300, alias=True) != []
    assert validate_ttl(None, alias=True) == []


def test_ttl_out_of_range():
    assert validate_ttl(-1, alias=False) != []
    assert validate_ttl(2147483648, alias=False) != []
    assert validate_ttl(2147483647, alias=False) == []
