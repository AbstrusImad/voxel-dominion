from gltest import get_contract_factory, create_account
from gltest.assertions import tx_execution_succeeded

VERDICTS = ("MASTERWORK", "WORTHY", "WEAK", "REJECT")


def _tower() -> str:
    # A tall, centered spire: a small footprint with a column climbing upward,
    # built to fit the opening era "The Ascending Age" (verticality).
    cells = [(7, 0, 8, 1), (8, 0, 8, 1), (9, 0, 8, 1), (8, 0, 7, 1), (8, 0, 9, 1)]
    for y in range(1, 11):
        cells.append((8, y, 8, 2))
    cells.append((8, 11, 8, 4))
    return "|".join(f"{x},{y},{z},{c}" for (x, y, z, c) in cells)


def test_dominion_consensus():
    factory = get_contract_factory("Dominion")
    contract = factory.deploy(args=[])

    stats = contract.get_stats(args=[]).call()
    assert int(stats["parcels"]) == 24
    assert int(stats["era"]) == 0

    parcels = contract.get_parcels(args=[0]).call()
    assert len(parcels) == 24
    target = parcels[0]["id"]
    assert parcels[0]["owner"] == ""
    assert int(parcels[0]["score"]) == 0

    # The AI consensus write: a builder raises a tall spire on an empty parcel
    # during the verticality era. Validators must agree on the verdict exactly
    # and the score within tolerance; the capture is applied deterministically.
    builder = create_account()
    rc = contract.connect(builder).submit_build(
        args=[
            target,
            "The First Spire",
            _tower(),
            "A slender tower reaching for the open sky, a banner for the ascending age.",
        ]
    ).transact()
    assert tx_execution_succeeded(rc)

    after = contract.get_parcels(args=[0]).call()
    claimed = next(p for p in after if p["id"] == target)
    assert claimed["title"] == "The First Spire"
    assert int(claimed["score"]) >= 50
    assert claimed["owner"] != ""

    stats2 = contract.get_stats(args=[]).call()
    assert int(stats2["builds"]) == 1
    assert int(stats2["captures"]) == 1
    assert int(stats2["held"]) == 1

    log = contract.get_chronicle(args=[0]).call()
    assert len(log) == 1
    assert log[0]["verdict"] in VERDICTS
    assert log[0]["captured"] is True
